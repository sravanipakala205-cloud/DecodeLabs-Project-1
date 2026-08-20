/* ==================================================
   TASKFLOW - JAVASCRIPT
   ================================================== */


/* ================= SELECT ELEMENTS ================= */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");

const clearCompletedButton =
    document.getElementById("clearCompleted");

const menuToggle =
    document.getElementById("menuToggle");

const mainNav =
    document.getElementById("mainNav");


/* ================= TASK DATA ================= */

let tasks = [];


/* ================= MOBILE MENU ================= */

menuToggle.addEventListener("click", () => {

    const isOpen =
        mainNav.classList.toggle("open");

    menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    menuToggle.setAttribute(
        "aria-label",
        isOpen
            ? "Close navigation menu"
            : "Open navigation menu"
    );

    menuToggle.textContent =
        isOpen ? "✕" : "☰";
});


/* Close mobile menu after clicking a link */

mainNav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

        mainNav.classList.remove("open");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

        menuToggle.textContent = "☰";
    });

});


/* ================= ADD TASK ================= */

taskForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const taskText =
        taskInput.value.trim();

    if (taskText === "") {
        return;
    }


    const newTask = {

        id: Date.now(),

        text: taskText,

        completed: false

    };


    tasks.push(newTask);

    taskInput.value = "";

    renderTasks();

    taskInput.focus();

});


/* ================= RENDER TASKS ================= */

function renderTasks() {

    taskList.innerHTML = "";


    if (tasks.length === 0) {

        emptyMessage.style.display = "block";

    } else {

        emptyMessage.style.display = "none";
    }


    tasks.forEach(task => {

        const listItem =
            document.createElement("li");

        listItem.className = "task-item";


        if (task.completed) {

            listItem.classList.add("completed");

        }


        /* Checkbox */

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className =
            "task-checkbox";

        checkbox.checked =
            task.completed;

        checkbox.setAttribute(
            "aria-label",
            `Mark "${task.text}" as ${
                task.completed
                    ? "incomplete"
                    : "completed"
            }`
        );


        checkbox.addEventListener(
            "change",
            () => {

                toggleTask(task.id);

            }
        );


        /* Task text */

        const taskText =
            document.createElement("span");

        taskText.className =
            "task-text";

        taskText.textContent =
            task.text;


        /* Delete button */

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "Delete";

        deleteButton.setAttribute(
            "aria-label",
            `Delete task: ${task.text}`
        );


        deleteButton.addEventListener(
            "click",
            () => {

                deleteTask(task.id);

            }
        );


        /* Add everything to list item */

        listItem.appendChild(checkbox);

        listItem.appendChild(taskText);

        listItem.appendChild(deleteButton);


        taskList.appendChild(listItem);

    });


    updateProgress();
}


/* ================= COMPLETE TASK ================= */

function toggleTask(taskId) {

    tasks = tasks.map(task => {

        if (task.id === taskId) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });


    renderTasks();
}


/* ================= DELETE TASK ================= */

function deleteTask(taskId) {

    tasks =
        tasks.filter(task => task.id !== taskId);

    renderTasks();
}


/* ================= CLEAR COMPLETED ================= */

clearCompletedButton.addEventListener(
    "click",
    () => {

        tasks =
            tasks.filter(task => !task.completed);

        renderTasks();

    }
);


/* ================= UPDATE PROGRESS ================= */

function updateProgress() {

    const totalTasks =
        tasks.length;


    const completedTasks =
        tasks.filter(
            task => task.completed
        ).length;


    let percentage = 0;


    if (totalTasks > 0) {

        percentage =
            Math.round(
                (completedTasks / totalTasks) * 100
            );

    }


    progressPercent.textContent =
        `${percentage}%`;


    progressText.textContent =
        `${completedTasks} of ${totalTasks} tasks completed`;


    progressFill.style.width =
        `${percentage}%`;


    const progressBar =
        document.querySelector(
            ".progress-bar"
        );


    progressBar.setAttribute(
        "aria-valuenow",
        String(percentage)
    );

}


/* ================= INITIAL DISPLAY ================= */

renderTasks();
