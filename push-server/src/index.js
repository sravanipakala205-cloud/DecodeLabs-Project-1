import { buildPushPayload } from "@block65/webcrypto-web-push";

const json = (data, status = 200, origin = "*") =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    }
  });

function allowedOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin");
  const appOrigin = env.APP_URL ? new URL(env.APP_URL).origin : "";
  return requestOrigin && requestOrigin === appOrigin ? appOrigin : appOrigin || "*";
}

function vapidConfig(env) {
  return {
    subject: env.VAPID_SUBJECT || env.APP_URL,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  };
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "TaskFlow notifications" }, 200, origin);
    }

    if (request.method === "GET" && url.pathname === "/api/config") {
      const { publicKey } = vapidConfig(env);
      if (!publicKey) return json({ error: "Push notifications are not configured yet." }, 503, origin);
      return json({ publicKey }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/api/subscribe") {
      try {
        const body = await request.json();
        const deviceId = String(body.deviceId || "").slice(0, 128);
        const subscription = body.subscription;
        const endpoint = subscription?.endpoint;
        const p256dh = subscription?.keys?.p256dh;
        const auth = subscription?.keys?.auth;

        if (!deviceId || typeof endpoint !== "string" || !endpoint.startsWith("https://") ||
            typeof p256dh !== "string" || typeof auth !== "string") {
          return json({ error: "Invalid device or push subscription." }, 400, origin);
        }

        await env.DB.prepare(
          `INSERT INTO subscriptions (device_id, endpoint, p256dh, auth, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(device_id) DO UPDATE SET
             endpoint = excluded.endpoint,
             p256dh = excluded.p256dh,
             auth = excluded.auth,
             updated_at = CURRENT_TIMESTAMP`
        ).bind(deviceId, endpoint, p256dh, auth).run();

        return json({ ok: true }, 200, origin);
      } catch (error) {
        console.error("Subscribe error:", error);
        return json({ error: "Could not save this device subscription." }, 500, origin);
      }
    }

    if (request.method === "PUT" && url.pathname === "/api/tasks") {
      try {
        const body = await request.json();
        const deviceId = String(body.deviceId || "").slice(0, 128);
        const tasks = Array.isArray(body.tasks) ? body.tasks : null;
        if (!deviceId || !tasks || tasks.length > 500) {
          return json({ error: "Invalid device or task list." }, 400, origin);
        }

        if (tasks.length === 0) {
          await env.DB.prepare("DELETE FROM tasks WHERE device_id = ?").bind(deviceId).run();
        } else {
          const statements = tasks
            .filter(task => task && task.id != null && task.date && Number.isFinite(new Date(task.date).getTime()))
            .map(task => env.DB.prepare(
              `INSERT INTO tasks (device_id, task_id, task_text, due_at, completed, reminder_sent)
               VALUES (?, ?, ?, ?, ?, 0)
               ON CONFLICT(device_id, task_id) DO UPDATE SET
                 task_text = excluded.task_text,
                 reminder_sent = CASE
                   WHEN due_at != excluded.due_at THEN 0
                   ELSE reminder_sent
                 END,
                 due_at = excluded.due_at,
                 completed = excluded.completed`
            ).bind(
              deviceId,
              String(task.id).slice(0, 128),
              String(task.text || "Your task").slice(0, 300),
              new Date(task.date).toISOString(),
              task.completed ? 1 : 0
            ));

          if (statements.length) await env.DB.batch(statements);

          const validIds = tasks
            .filter(task => task && task.id != null && task.date && Number.isFinite(new Date(task.date).getTime()))
            .map(task => String(task.id).slice(0, 128));

          if (validIds.length) {
            const placeholders = validIds.map(() => "?").join(",");
            await env.DB.prepare(
              `DELETE FROM tasks WHERE device_id = ? AND task_id NOT IN (${placeholders})`
            ).bind(deviceId, ...validIds).run();
          } else {
            await env.DB.prepare("DELETE FROM tasks WHERE device_id = ?").bind(deviceId).run();
          }
        }

        return json({ ok: true }, 200, origin);
      } catch (error) {
        console.error("Task sync error:", error);
        return json({ error: "Could not sync tasks." }, 500, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  },

  async scheduled(controller, env) {
    const vapid = vapidConfig(env);
    if (!vapid.publicKey || !vapid.privateKey || !vapid.subject) {
      console.error("VAPID keys are not configured.");
      return;
    }

    const now = new Date();
    const until = new Date(now.getTime() + 15 * 60 * 1000);
    const dueTasks = await env.DB.prepare(
      `SELECT t.device_id, t.task_id, t.task_text, t.due_at,
              s.endpoint, s.p256dh, s.auth
       FROM tasks t
       JOIN subscriptions s ON s.device_id = t.device_id
       WHERE t.completed = 0
         AND t.reminder_sent = 0
         AND t.due_at > ?
         AND t.due_at <= ?`
    ).bind(now.toISOString(), until.toISOString()).all();

    for (const task of dueTasks.results || []) {
      const subscription = {
        endpoint: task.endpoint,
        expirationTime: null,
        keys: { p256dh: task.p256dh, auth: task.auth }
      };
      const message = {
        data: JSON.stringify({
          title: "TaskFlow Reminder",
          body: task.task_text + " - Your deadline is approaching!",
          tag: "task-" + task.task_id,
          url: env.APP_URL || "/"
        }),
        options: { ttl: 3600 }
      };

      try {
        const payload = await buildPushPayload(message, subscription, vapid);
        const response = await fetch(subscription.endpoint, payload);
        if (response.ok || response.status === 201) {
          await env.DB.prepare(
            "UPDATE tasks SET reminder_sent = 1 WHERE device_id = ? AND task_id = ?"
          ).bind(task.device_id, task.task_id).run();
        } else if (response.status === 404 || response.status === 410) {
          await env.DB.prepare("DELETE FROM subscriptions WHERE device_id = ?")
            .bind(task.device_id).run();
        } else {
          console.error("Push service returned status:", response.status);
        }
      } catch (error) {
        console.error("Push delivery failed:", error);
      }
    }
  }
};
