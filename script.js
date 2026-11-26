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
        updateDashboard();
        displayTodaySchedule();
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

    updateDashboard();
    displayTodaySchedule();
}

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
        updateDashboard();
        displayUpcomingDeadlines();
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

    updateDashboard();
    displayUpcomingDeadlines();
}

function updateDashboard() {
    const pendingCount = document.getElementById("pending-count");

    const pendingAssignments = assignments.filter((assignment) => {
        return assignment.progress < 100;
    });

    pendingCount.textContent = pendingAssignments.length;

    const remainingHours = document.getElementById("remaining-hours");

    let totalHours = 0;

    assignments.forEach((assignment) => {
        const remaining = assignment.hours * (1 - assignment.progress / 100);

        totalHours += remaining;
    });

    remainingHours.textContent = totalHours.toFixed(1);

    const overallProgress = document.getElementById("overall-progress");

    let totalProgress = 0;

    assignments.forEach((assignment) => {
        totalProgress += assignment.progress;
    });

    const averageProgress = assignments.length > 0
        ? totalProgress / assignments.length
        : 0;

    overallProgress.textContent = `${Math.round(averageProgress)}%`;

    const todayEvents = document.getElementById("today-events");

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    const today = days[new Date().getDay()];

    const todaysEvents = events.filter((event) => {
        return event.day === today;
    });

    todayEvents.textContent = todaysEvents.length;
}

function displayTodaySchedule() {
    const scheduleList = document.getElementById("today-schedule");
    scheduleList.innerHTML = "";

    const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    const today = days[new Date().getDay()];

    const todaysEvents = events
        .filter((event) => event.day === today)
        .sort((a, b) => a.start.localeCompare(b.start));

    if (todaysEvents.length === 0) {
        scheduleList.textContent = "No events scheduled for today.";
        return;
    }

    todaysEvents.forEach((event) => {
        const eventItem = document.createElement("div");
        eventItem.className = "event-item";

        const title = document.createElement("strong");
        title.textContent = event.name;

        const details = document.createElement("p");
        details.textContent =
            `${event.start} - ${event.end} | ${event.category}`;

        eventItem.appendChild(title);
        eventItem.appendChild(details);

        scheduleList.appendChild(eventItem);
    });
}

function displayUpcomingDeadlines() {
    const deadlineList = document.getElementById("upcoming-deadlines");
    deadlineList.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = assignments
        .filter((assignment) => {
            const dueDate = new Date(assignment.due + "T00:00:00");

            return assignment.progress < 100 && dueDate >= today;
        })
        .sort((a, b) => a.due.localeCompare(b.due))
        .slice(0, 3);

    if (upcoming.length === 0) {
        deadlineList.textContent = "No upcoming deadlines.";
        return;
    }

    upcoming.forEach((assignment) => {
        const item = document.createElement("div");
        item.className = "assignment-item";

        const title = document.createElement("strong");
        title.textContent = assignment.name;

        const details = document.createElement("p");
        details.textContent = `${assignment.course} | Due: ${assignment.due}`;

        item.appendChild(title);
        item.appendChild(details);

        deadlineList.appendChild(item);
    });
}

displayEvents();
displayAssignments();

const generatePlanBtn = document.getElementById("generate-plan-btn");

generatePlanBtn.addEventListener("click", () => {
    const startTime = document.getElementById("study-start").value;
    const endTime = document.getElementById("study-end").value;

    if (!startTime || !endTime) {
        alert("Please select your available study time.");
        return;
    }

    if (endTime <= startTime) {
        alert("End time must be after start time.");
        return;
    }

    const availableSlots = getAvailableStudySlots(startTime, endTime);
    const prioritizedAssignments = getPrioritizedAssignments();

    const studyPlan = generateStudyPlan(
        availableSlots,
        prioritizedAssignments
    );

    const planList = document.getElementById("study-plan-list");
    planList.innerHTML = "";

    document.getElementById("study-summary").hidden = true;

    if (availableSlots.length === 0) {
        planList.textContent = "No available study time today.";
        return;
    }

    if (prioritizedAssignments.length === 0) {
        planList.textContent = "No pending assignments to schedule.";
        return;
    }

    studyPlan.forEach((session) => {
        const sessionItem = document.createElement("div");
        sessionItem.className = "event-item";

        const title = document.createElement("strong");
        title.textContent = session.name;

        const details = document.createElement("p");

        if (session.type === "break") {
            details.textContent =
                `${session.start} - ${session.end} | ${session.duration} min break`;
        } else {
            details.textContent =
                `${session.start} - ${session.end} | ${session.course} | ${session.duration} min`;
        }

        sessionItem.appendChild(title);
        sessionItem.appendChild(details);

        planList.appendChild(sessionItem);
    });

    displayStudySummary(studyPlan);
});

function getAvailableStudySlots(startTime, endTime) {
    const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    const today = days[new Date().getDay()];

    const todaysEvents = events
        .filter((event) => event.day === today)
        .sort((a, b) => a.start.localeCompare(b.start));

    const availableSlots = [];
    let currentTime = startTime;

    todaysEvents.forEach((event) => {
        // Ignore events outside the available study hours
        if (event.end <= startTime || event.start >= endTime) {
            return;
        }

        // Save free time before the next event
        if (event.start > currentTime) {
            availableSlots.push({
                start: currentTime,
                end: event.start < endTime ? event.start : endTime
            });
        }

        // Move forward to the end of the event
        if (event.end > currentTime) {
            currentTime = event.end;
        }
    });

    // Save any remaining free time
    if (currentTime < endTime) {
        availableSlots.push({
            start: currentTime,
            end: endTime
        });
    }

    return availableSlots;
}

function getPrioritizedAssignments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prioritizedAssignments = assignments
        .filter((assignment) => assignment.progress < 100)
        .map((assignment) => {
            const dueDate = new Date(assignment.due + "T00:00:00");

            const daysLeft = Math.round(
                (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            const remainingHours =
                assignment.hours * (1 - assignment.progress / 100);

            const urgency = Math.max(daysLeft + 1, 1);

            const priorityScore = remainingHours / urgency;

            return {
                ...assignment,
                daysLeft: daysLeft,
                remainingHours: remainingHours,
                priorityScore: priorityScore
            };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore);

    return prioritizedAssignments;
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function generateStudyPlan(availableSlots, prioritizedAssignments) {
    const studyPlan = [];

    const STUDY_DURATION = Number(
        localStorage.getItem("sessionDuration") ?? 90
    );

    const BREAK_DURATION = Number(
        localStorage.getItem("breakDuration") ?? 15
    );

    // Copy assignments so original data is not changed
    const tasks = prioritizedAssignments.map((assignment) => ({
        ...assignment,
        remainingMinutes: Math.ceil(assignment.remainingHours * 60)
    }));

    for (const slot of availableSlots) {
        let currentTime = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end);

        for (const task of tasks) {
            while (task.remainingMinutes > 0 && currentTime < slotEnd) {
                const availableMinutes = slotEnd - currentTime;

                const sessionMinutes = Math.min(
                    STUDY_DURATION,
                    task.remainingMinutes,
                    availableMinutes
                );

                studyPlan.push({
                    type: "study",
                    name: task.name,
                    course: task.course,
                    start: minutesToTime(currentTime),
                    end: minutesToTime(currentTime + sessionMinutes),
                    duration: sessionMinutes
                });

                currentTime += sessionMinutes;
                task.remainingMinutes -= sessionMinutes;

                // Add a break after a full study session
                // only if there is more work to schedule.
                const hasRemainingWork = tasks.some(
                    (item) => item.remainingMinutes > 0
                );

                if (
                    sessionMinutes === STUDY_DURATION &&
                    hasRemainingWork &&
                    BREAK_DURATION > 0 &&
                    currentTime + BREAK_DURATION < slotEnd
                ) {
                    studyPlan.push({
                        type: "break",
                        name: "Break ☕",
                        start: minutesToTime(currentTime),
                        end: minutesToTime(currentTime + BREAK_DURATION),
                        duration: BREAK_DURATION
                    });

                    currentTime += BREAK_DURATION;
                }
            }

            if (currentTime >= slotEnd) {
                break;
            }
        }
    }

    return studyPlan;
}

function displayStudySummary(studyPlan) {
    const summary = document.getElementById("study-summary");

    const studySessions = studyPlan.filter(
        (session) => session.type === "study"
    );

    const breakSessions = studyPlan.filter(
        (session) => session.type === "break"
    );

    const totalStudyMinutes = studySessions.reduce(
        (total, session) => total + session.duration,
        0
    );

    const totalBreakMinutes = breakSessions.reduce(
        (total, session) => total + session.duration,
        0
    );

    document.getElementById("total-study-time").textContent =
        `${(totalStudyMinutes / 60).toFixed(1)} hours`;

    document.getElementById("study-session-count").textContent =
        studySessions.length;

    document.getElementById("total-break-time").textContent =
        `${totalBreakMinutes} minutes`;

    summary.hidden = false;
}

const studyStartInput = document.getElementById("study-start");
const studyEndInput = document.getElementById("study-end");

// Load previously saved study hours
const savedStudyStart = localStorage.getItem("studyStart");
const savedStudyEnd = localStorage.getItem("studyEnd");

if (savedStudyStart) {
    studyStartInput.value = savedStudyStart;
}

if (savedStudyEnd) {
    studyEndInput.value = savedStudyEnd;
}

// Save study hours whenever they change
studyStartInput.addEventListener("change", () => {
    localStorage.setItem("studyStart", studyStartInput.value);
});

studyEndInput.addEventListener("change", () => {
    localStorage.setItem("studyEnd", studyEndInput.value);
});

const sessionDurationInput = document.getElementById("session-duration");
const breakDurationInput = document.getElementById("break-duration");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const settingsMessage = document.getElementById("settings-message");

// Load saved preferences
sessionDurationInput.value =
    localStorage.getItem("sessionDuration") || "90";

breakDurationInput.value =
    localStorage.getItem("breakDuration") ?? "15";

// Save preferences
saveSettingsBtn.addEventListener("click", () => {
    const sessionDuration = Number(sessionDurationInput.value);
    const breakDuration = Number(breakDurationInput.value);

    if (
        !Number.isInteger(sessionDuration) ||
        sessionDuration < 15 ||
        sessionDuration > 180 ||
        !Number.isInteger(breakDuration) ||
        breakDuration < 0 ||
        breakDuration > 60
    ) {
        settingsMessage.textContent =
            "Please enter valid study and break durations.";
        return;
    }

    localStorage.setItem("sessionDuration", sessionDuration);
    localStorage.setItem("breakDuration", breakDuration);

    settingsMessage.textContent = "Settings saved successfully!";
});