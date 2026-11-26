
/* =========================================
   TASKFLOW - SMART TASK MANAGEMENT APP
   ========================================= */


/* =============== SELECT ELEMENTS =============== */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");

const clearCompletedButton =
    document.getElementById("clearCompleted");

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");


/* =============== TASK STORAGE =============== */

const STORAGE_KEY = "taskflowTasks";

function loadTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

let tasks = loadTasks();

function saveTasks() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}


/* =============== FILTER =============== */

let currentFilter = "all";


/* =============== MOBILE MENU =============== */

if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            mainNav.classList.toggle("open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuToggle.textContent =
            isOpen ? "✕" : "☰";
    });

    mainNav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            mainNav.classList.remove("open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            menuToggle.textContent = "☰";
        });

    });
}


/* =============== ADD TASK =============== */

taskForm.addEventListener("submit", event => {

    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) return;

    const dateInput =
        document.getElementById("taskDate");

    const priorityInput =
        document.getElementById("taskPriority");

    const newTask = {

        id: Date.now().toString(),

        text: text,

        completed: false,

        date: dateInput?.value || "",

        priority: priorityInput?.value || "medium",

        notified: false

    };

    tasks.push(newTask);

    saveTasks();

    renderTasks();

    taskForm.reset();

    taskInput.focus();

});


/* =============== RENDER TASKS =============== */

function renderTasks() {

    taskList.innerHTML = "";

    const filteredTasks = tasks.filter(task => {

        if (currentFilter === "pending") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";

    filteredTasks.forEach(task => {

        const item = document.createElement("li");

        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        /* Checkbox */

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className = "task-checkbox";

        checkbox.checked = task.completed;

        checkbox.setAttribute(
            "aria-label",
            "Complete " + task.text
        );

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });


        /* Task details */

        const details = document.createElement("div");

        details.className = "task-details";

        const title = document.createElement("span");

        title.className = "task-text";

        title.textContent = task.text;

        details.appendChild(title);


        /* Priority */

        const meta = document.createElement("div");

        meta.className = "task-meta";

        const priority = document.createElement("span");

        priority.className =
            "task-priority priority-" +
            (task.priority || "medium");

        priority.textContent =
            (task.priority || "medium").toUpperCase() +
            " PRIORITY";

        meta.appendChild(priority);


        /* Deadline */

        if (task.date) {

            const deadline = document.createElement("span");

            const date = new Date(task.date);

            deadline.textContent =
                "Due: " +
                date.toLocaleString();

            meta.appendChild(deadline);

        }

        details.appendChild(meta);


        /* Delete button */

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className = "delete-button";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });


        item.appendChild(checkbox);

        item.appendChild(details);

        item.appendChild(deleteButton);

        taskList.appendChild(item);

    });

    updateProgress();

}


/* =============== COMPLETE TASK =============== */

function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });

    saveTasks();

    renderTasks();

}


/* =============== DELETE TASK =============== */

function deleteTask(id) {

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();

    renderTasks();

}


/* =============== CLEAR COMPLETED =============== */

if (clearCompletedButton) {

    clearCompletedButton.addEventListener("click", () => {

        tasks = tasks.filter(task => !task.completed);

        saveTasks();

        renderTasks();

    });

}


/* =============== TASK FILTERS =============== */

document.querySelectorAll(".filter-button").forEach(button => {

    button.addEventListener("click", () => {

        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter-button")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        renderTasks();

    });

});


/* =============== PROGRESS =============== */

function updateProgress() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    progressPercent.textContent = percentage + "%";

    progressText.textContent =
        completed + " of " + total + " tasks completed";

    progressFill.style.width = percentage + "%";

    const bar = document.querySelector(".progress-bar");

    if (bar) {
        bar.setAttribute("aria-valuenow", percentage);
    }

}


/* =============== PUSH NOTIFICATIONS =============== */

const notificationButton = document.getElementById("enableNotifications");
const API_BASE_URL = window.TASKFLOW_API_URL || "";
const DEVICE_KEY = "taskflowDeviceId";
const deviceId = localStorage.getItem(DEVICE_KEY) || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
localStorage.setItem(DEVICE_KEY, deviceId);

function updateNotificationButton() {
    if (!("Notification" in window)) {
        notificationButton.textContent = "Notifications Not Supported";
        notificationButton.disabled = true;
    } else if (Notification.permission === "denied") {
        notificationButton.textContent = "Notifications Blocked";
    } else if (Notification.permission === "granted") {
        notificationButton.textContent = "Enable Background Reminders";
    } else {
        notificationButton.textContent = "Enable Notifications";
    }
}

function urlBase64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

async function syncTasksToPushServer() {
    if (!API_BASE_URL) return;
    try {
        await fetch(API_BASE_URL + "/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId, tasks })
        });
    } catch (error) {
        console.error("TaskFlow task sync failed:", error);
    }
}

async function enableBackgroundNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Background push notifications are not supported by this browser.");
        return;
    }
    if (!API_BASE_URL) {
        alert("The TaskFlow push server is not connected yet. Follow PUSH-SETUP.md in the GitHub repository to deploy it.");
        return;
    }
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") {
        alert("Please allow notifications in your browser site settings.");
        updateNotificationButton();
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const configResponse = await fetch(API_BASE_URL + "/api/config");
        if (!configResponse.ok) throw new Error("Could not load push server configuration.");
        const { publicKey } = await configResponse.json();
        if (!publicKey) throw new Error("Push server VAPID public key is not configured.");
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
        }
        const response = await fetch(API_BASE_URL + "/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId, subscription })
        });
        if (!response.ok) throw new Error("Could not save this device's push subscription.");
        await syncTasksToPushServer();
        alert("Background notifications enabled on this device!");
        updateNotificationButton();
    } catch (error) {
        console.error(error);
        alert("Could not enable background notifications: " + error.message);
    }
}

notificationButton.addEventListener("click", enableBackgroundNotifications);
updateNotificationButton();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => console.log("TaskFlow service worker registered."))
            .catch(error => console.error("Service worker registration failed:", error));
    });
}

const originalSaveTasks = saveTasks;
saveTasks = function () {
    originalSaveTasks();
    syncTasksToPushServer();
};

/* Fallback reminders while this page is open. */
function checkReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = Date.now();
    tasks.forEach(task => {
        if (!task.date || task.completed || task.notified) return;
        const timeLeft = new Date(task.date).getTime() - now;
        if (timeLeft <= 15 * 60 * 1000 && timeLeft >= 0) {
            new Notification("TaskFlow Reminder", {
                body: task.text + " - Your deadline is approaching!",
                tag: "task-" + task.id
            });
            task.notified = true;
            originalSaveTasks();
        }
    });
}
checkReminders();
setInterval(checkReminders, 60 * 1000);

/* =============== INITIAL DISPLAY =============== */

renderTasks();
