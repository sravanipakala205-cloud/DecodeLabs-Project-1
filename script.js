/* =========================================================
   TASKFLOW
   JavaScript Functionality
   ========================================================= */


/* ==================== SELECT ELEMENTS ==================== */

const menuToggle =
    document.getElementById("menuToggle");

const navigation =
    document.getElementById("navigation");

const taskInput =
    document.getElementById("taskInput");

const addTaskButton =
    document.getElementById("addTaskButton");

const taskList =
    document.getElementById("taskList");

const emptyMessage =
    document.getElementById("emptyMessage");

const errorMessage =
    document.getElementById("errorMessage");

const clearCompletedButton =
    document.getElementById("clearCompleted");

const progressFill =
    document.getElementById("progressFill");

const progressPercentage =
    document.getElementById("progressPercentage");

const progressText =
    document.getElementById("progressText");


/* ==================== MOBILE MENU ==================== */

menuToggle.addEventListener(
    "click",
    function () {

        const isOpen =
            navigation.classList.toggle("active");

        menuToggle.setAttribute(
            "aria-expanded",
            isOpen
        );

        menuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );

        menuToggle.textContent =
            isOpen ? "✕" : "☰";

    }
);


/* ==================== CLOSE MOBILE MENU ==================== */

const navigationLinks =
    navigation.querySelectorAll("a");

navigationLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                navigation.classList.remove("active");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuToggle.setAttribute(
                    "aria-label",
                    "Open navigation menu"
                );

                menuToggle.textContent = "☰";

            }
        );

    }
);


/* ==================== ADD TASK ==================== */

function addTask() {

    const taskText =
        taskInput.value.trim();


    /* Check for empty input */

    if (taskText === "") {

        errorMessage.textContent =
            "Please enter a task.";

        taskInput.focus();

        return;

    }


    /* Clear previous error */

    errorMessage.textContent = "";


    /* Create task */

    const taskItem =
        document.createElement("div");

    taskItem.className =
        "task-item";


    /* Create checkbox */

    const checkbox =
        document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.className =
        "task-checkbox";

    checkbox.setAttribute(
        "aria-label",
        `Mark "${taskText}" as completed`
    );


    /* Create task text */

    const textElement =
        document.createElement("span");

    textElement.className =
        "task-text";

    textElement.textContent =
        taskText;


    /* Create delete button */

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "delete-button";

    deleteButton.textContent = "✕";

    deleteButton.setAttribute(
        "aria-label",
        `Delete task "${taskText}"`
    );


    /* Add elements to task */

    taskItem.appendChild(checkbox);

    taskItem.appendChild(textElement);

    taskItem.appendChild(deleteButton);


    /* Add task to list */

    taskList.appendChild(taskItem);


    /* Hide empty message */

    emptyMessage.style.display =
        "none";


    /* Clear input */

    taskInput.value = "";

    taskInput.focus();


    /* Checkbox functionality */

    checkbox.addEventListener(
        "change",
        function () {

            taskItem.classList.toggle(
                "completed",
                checkbox.checked
            );

            updateProgress();

        }
    );


    /* Delete functionality */

    deleteButton.addEventListener(
        "click",
        function () {

            taskItem.remove();

            checkEmptyList();

            updateProgress();

        }
    );


    /* Update progress */

    updateProgress();

}


/* ==================== ADD BUTTON ==================== */

addTaskButton.addEventListener(
    "click",
    addTask
);


/* ==================== ENTER KEY ==================== */

taskInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            addTask();

        }

    }
);


/* ==================== CHECK EMPTY LIST ==================== */

function checkEmptyList() {

    const tasks =
        taskList.querySelectorAll(
            ".task-item"
        );

    if (tasks.length === 0) {

        emptyMessage.style.display =
            "block";

    } else {

        emptyMessage.style.display =
            "none";

    }

}


/* ==================== CLEAR COMPLETED ==================== */

clearCompletedButton.addEventListener(
    "click",
    function () {

        const completedTasks =
            taskList.querySelectorAll(
                ".task-item.completed"
            );

        completedTasks.forEach(
            function (task) {

                task.remove();

            }
        );

        checkEmptyList();

        updateProgress();

    }
);


/* ==================== UPDATE PROGRESS ==================== */

function updateProgress() {

    const allTasks =
        taskList.querySelectorAll(
            ".task-item"
        );

    const completedTasks =
        taskList.querySelectorAll(
            ".task-item.completed"
        );


    const total =
        allTasks.length;

    const completed =
        completedTasks.length;


    let percentage = 0;


    if (total > 0) {

        percentage =
            Math.round(
                (completed / total) * 100
            );

    }


    /* Update progress bar */

    progressFill.style.width =
        `${percentage}%`;


    /* Update percentage */

    progressPercentage.textContent =
        `${percentage}%`;


    /* Update text */

    progressText.textContent =
        `${completed} of ${total} tasks completed`;

}


/* ==================== INITIAL STATE ==================== */

checkEmptyList();

updateProgress();