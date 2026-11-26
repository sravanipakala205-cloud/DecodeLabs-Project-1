const express = require("express");
const cors = require("cors");
const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json({ limit: "256kb" }));

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "taskflow-data.json");
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error("Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.");
  process.exit(1);
}
webpush.setVapidDetails(CONTACT, PUBLIC_KEY, PRIVATE_KEY);

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { devices: {}, sent: {} }; }
}
function writeData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/config", (_req, res) => res.json({ publicKey: PUBLIC_KEY }));

app.post("/api/subscribe", (req, res) => {
  const { deviceId, subscription } = req.body || {};
  if (!deviceId || !subscription?.endpoint || !subscription?.keys) {
    return res.status(400).json({ error: "A valid deviceId and push subscription are required." });
  }
  const data = readData();
  data.devices[deviceId] = data.devices[deviceId] || { subscription, tasks: [] };
  data.devices[deviceId].subscription = subscription;
  writeData(data);
  res.json({ ok: true });
});

app.put("/api/tasks", (req, res) => {
  const { deviceId, tasks } = req.body || {};
  if (!deviceId || !Array.isArray(tasks)) return res.status(400).json({ error: "deviceId and tasks are required." });
  const data = readData();
  data.devices[deviceId] = data.devices[deviceId] || {};
  data.devices[deviceId].tasks = tasks.filter(task =>
    task && typeof task.id === "string" && typeof task.text === "string" &&
    typeof task.date === "string" && !task.completed
  );
  writeData(data);
  res.json({ ok: true, saved: data.devices[deviceId].tasks.length });
});

async function sendDueReminders() {
  const data = readData();
  const now = Date.now();
  let changed = false;
  for (const [deviceId, device] of Object.entries(data.devices)) {
    if (!device.subscription) continue;
    for (const task of (device.tasks || [])) {
      const deadline = new Date(task.date).getTime();
      if (!Number.isFinite(deadline)) continue;
      const dueAt = deadline - 15 * 60 * 1000;
      const key = deviceId + ":" + task.id + ":" + task.date;
      if (now < dueAt || now > deadline || data.sent[key]) continue;
      try {
        await webpush.sendNotification(device.subscription, JSON.stringify({
          title: "TaskFlow Reminder",
          body: task.text + " - Your deadline is in about 15 minutes.",
          tag: "task-" + task.id,
          url: process.env.APP_URL || "https://sravanipakala205-cloud.github.io/DecodeLabs-Project-1/"
        }));
        data.sent[key] = true;
        changed = true;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          delete data.devices[deviceId].subscription;
          changed = true;
        } else {
          console.error("Push delivery failed:", error.message);
        }
      }
    }
  }
  if (changed) writeData(data);
}
// Poll once per minute. The server must remain running for scheduled delivery.
setInterval(sendDueReminders, 60 * 1000);
sendDueReminders();

app.listen(PORT, () => console.log("TaskFlow push server listening on " + PORT));
