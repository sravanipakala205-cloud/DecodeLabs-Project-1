
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


/* =============== NOTIFICATIONS =============== */

const notificationButton =
    document.getElementById("enableNotifications");

if (notificationButton) {

    notificationButton.addEventListener("click", async () => {

        if (!("Notification" in window)) {

            alert("Your browser does not support notifications.");

            return;
        }

        const permission =
            await Notification.requestPermission();

        if (permission === "granted") {

            alert("TaskFlow notifications enabled!");

            checkReminders();

        } else {

            alert("Please allow notifications in browser settings.");

        }

    });

}


/* =============== DEADLINE REMINDERS =============== */


function checkReminders() {

    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const now = Date.now();

    tasks.forEach(task => {

        if (!task.date || task.completed || task.notified) {
            return;
        }

        const deadline = new Date(task.date).getTime();

        if (!Number.isFinite(deadline)) return;

        const timeLeft = deadline - now;

        // Notify only during the 15 minutes before the deadline.

        if (timeLeft <= 15 * 60 * 1000 && timeLeft >= 0) {

            new Notification("TaskFlow Reminder", {
                body: task.text + " - Your deadline is approaching!",
                tag: "task-" + task.id
            });

            task.notified = true;

            saveTasks();
        }

    });

}


/* Check reminders every minute while the page is open */

checkReminders();

setInterval(checkReminders, 60 * 1000);


/* =============== INITIAL DISPLAY =============== */

renderTasks();
