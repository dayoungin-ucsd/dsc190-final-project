const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const targetPage = item.dataset.page;

        navItems.forEach((nav) => {
            nav.classList.remove("active");
        });

        pages.forEach((page) => {
            page.classList.remove("active");
        });

        item.classList.add("active");

        document.getElementById(targetPage).classList.add("active");
    });
});

const addEventBtn = document.getElementById("add-event-btn");
const eventForm = document.getElementById("event-form");

addEventBtn.addEventListener("click", () => {
    eventForm.hidden = !eventForm.hidden;
});

const eventList = document.getElementById("event-list");
let events = JSON.parse(localStorage.getItem("events")) || [];

eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("event-name").value;
    const day = document.getElementById("event-day").value;
    const start = document.getElementById("event-start").value;
    const end = document.getElementById("event-end").value;
    const category = document.getElementById("event-category").value;

    if (end <= start) {
        alert("End time must be after start time.");
        return;
    }

    const hasConflict = events.some((event) => {
        return event.day === day &&
            start < event.end &&
            end > event.start;
    });

    if (hasConflict) {
        alert("This event overlaps with an existing event.");
        return;
    }

    const newEvent = {
        name: name,
        day: day,
        start: start,
        end: end,
        category: category
    };

    events.push(newEvent);

    localStorage.setItem("events", JSON.stringify(events));

    displayEvents();

    eventForm.reset();
    eventForm.hidden = true;
});

function displayEvents() {
    eventList.innerHTML = "";

    if (events.length === 0) {
        eventList.textContent = "No recurring events added yet.";
        return;
    }

    events.forEach((event, index) => {
        const eventItem = document.createElement("div");
        eventItem.className = "event-item";

        const eventTitle = document.createElement("strong");
        eventTitle.textContent = event.name;

        const eventDetails = document.createElement("p");
        eventDetails.textContent =
            `${event.day} | ${event.start} - ${event.end} | ${event.category}`;

        eventItem.appendChild(eventTitle);
        eventItem.appendChild(eventDetails);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";

        deleteBtn.addEventListener("click", () => {
            events.splice(index, 1);

            localStorage.setItem("events", JSON.stringify(events));

            displayEvents();
        });

        eventItem.appendChild(deleteBtn);
        eventList.appendChild(eventItem);
    });
}

displayEvents();

const addAssignmentBtn = document.getElementById("add-assignment-btn");
const assignmentForm = document.getElementById("assignment-form");

addAssignmentBtn.addEventListener("click", () => {
    assignmentForm.hidden = !assignmentForm.hidden;
});

const assignmentList = document.getElementById("assignment-list");
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];

assignmentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("assignment-name").value.trim();
    const course = document.getElementById("assignment-course").value.trim();
    const due = document.getElementById("assignment-due").value;
    const hours = Number(document.getElementById("assignment-hours").value);
    const progress = Number(document.getElementById("assignment-progress").value);

    if (!name || !course || !due || hours <= 0 || progress < 0 || progress > 100) {
        alert("Please enter valid assignment information.");
        return;
    }

    const newAssignment = {
        name: name,
        course: course,
        due: due,
        hours: hours,
        progress: progress
    };

    assignments.push(newAssignment);

    localStorage.setItem("assignments", JSON.stringify(assignments));

    displayAssignments();

    assignmentForm.reset();
    assignmentForm.hidden = true;
});

function displayAssignments() {
    assignmentList.innerHTML = "";

    if (assignments.length === 0) {
        assignmentList.textContent = "No assignments added yet.";
        return;
    }

    assignments.sort((a, b) => a.due.localeCompare(b.due));

    assignments.forEach((assignment, index) => {
        const assignmentItem = document.createElement("div");
        assignmentItem.className = "assignment-item";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(assignment.due + "T00:00:00");

        const daysLeft = Math.round(
            (dueDate - today) / (1000 * 60 * 60 * 24)
        );

        const assignmentTitle = document.createElement("strong");
        assignmentTitle.textContent = assignment.name;

        const assignmentDetails = document.createElement("p");
        assignmentDetails.textContent =
            `${assignment.course} | Due: ${assignment.due} | Estimated: ${assignment.hours} hours | Progress: ${assignment.progress}%`;

        const deadlineText = document.createElement("p");

        if (daysLeft < 0) {
            deadlineText.textContent = `${Math.abs(daysLeft)} days overdue`;
        } else if (daysLeft === 0) {
            deadlineText.textContent = "Due today!";
        } else if (daysLeft === 1) {
            deadlineText.textContent = "1 day left";
        } else {
            deadlineText.textContent = `${daysLeft} days left`;
        }

        if (daysLeft <= 0) {
            deadlineText.className = "deadline-urgent";
        } else if (daysLeft <= 6) {
            deadlineText.className = "deadline-soon";
        } else {
            deadlineText.className = "deadline-safe";
        }

        assignmentItem.appendChild(assignmentTitle);
        assignmentItem.appendChild(assignmentDetails);
        assignmentItem.appendChild(deadlineText);

        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";

        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";
        progressFill.style.width = `${assignment.progress}%`;

        progressBar.appendChild(progressFill);
        assignmentItem.appendChild(progressBar);

        const progressBtn = document.createElement("button");
        progressBtn.textContent = "Update Progress";
        progressBtn.className = "progress-btn";

        progressBtn.addEventListener("click", () => {
            const newProgress = prompt(
                "Enter new progress (0-100):",
                assignment.progress
            );

            if (newProgress === null) {
                return;
            }

            const progressValue = Number(newProgress);

            if (
                newProgress.trim() === "" ||
                !Number.isFinite(progressValue) ||
                progressValue < 0 ||
                progressValue > 100
            ) {
                alert("Please enter a number between 0 and 100.");
                return;
            }

            assignments[index].progress = progressValue;

            localStorage.setItem("assignments", JSON.stringify(assignments));

            displayAssignments();
        });

        assignmentItem.appendChild(progressBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";

        deleteBtn.addEventListener("click", () => {
            assignments.splice(index, 1);

            localStorage.setItem("assignments", JSON.stringify(assignments));

            displayAssignments();
        });

        assignmentItem.appendChild(deleteBtn);

        assignmentList.appendChild(assignmentItem);
    });
}

displayAssignments();