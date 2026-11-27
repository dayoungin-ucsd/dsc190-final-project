const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const targetPage = item.dataset.page;

        navItems.forEach((nav) => nav.classList.remove("active"));
        pages.forEach((page) => page.classList.remove("active"));

        item.classList.add("active");
        document.getElementById(targetPage).classList.add("active");
    });
});

const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDayName(dateString) {
    return days[new Date(`${dateString}T12:00:00`).getDay()];
}

function getDaysBetween(startDate, endDate) {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);

    return Math.round((end - start) / 86400000);
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function loadStoredObject(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));

        return value && typeof value === "object" && !Array.isArray(value)
            ? value
            : {};
    } catch {
        return {};
    }
}

const addEventBtn = document.getElementById("add-event-btn");
const eventForm = document.getElementById("event-form");
const eventList = document.getElementById("event-list");

let events = loadStoredArray("events");

addEventBtn.addEventListener("click", () => {
    eventForm.hidden = !eventForm.hidden;
});

eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("event-name").value.trim();

    const selectedDays = Array.from(
        document.querySelectorAll('input[name="event-days"]:checked')
    ).map((checkbox) => checkbox.value);

    const start = document.getElementById("event-start").value;
    const end = document.getElementById("event-end").value;
    const category = document.getElementById("event-category").value;

    if (!name || selectedDays.length === 0 || !start || !end || end <= start) {
        alert("Please enter valid event information and select at least one day.");
        return;
    }

    const conflictingDays = selectedDays.filter((day) => {
        return events.some((event) => {
            return (
                event.day === day &&
                start < event.end &&
                end > event.start
            );
        });
    });

    if (conflictingDays.length > 0) {
        alert(
            `This event overlaps with an existing event on: ${conflictingDays.join(", ")}.`
        );
        return;
    }

    selectedDays.forEach((day) => {
        events.push({
            name,
            day,
            start,
            end,
            category
        });
    });

    localStorage.setItem("events", JSON.stringify(events));

    displayEvents();

    eventForm.reset();
    eventForm.hidden = true;
});

function displayEvents() {
    eventList.innerHTML = "";

    if (events.length === 0) {
        eventList.textContent = "No recurring events added yet.";
    } else {
        events.forEach((event, index) => {
            const eventItem = document.createElement("div");
            eventItem.className = "event-item";

            const title = document.createElement("strong");
            title.textContent = event.name;

            const details = document.createElement("p");
            details.textContent =
                `${event.day} | ${event.start} - ${event.end} | ${event.category}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-btn";

            deleteBtn.addEventListener("click", () => {
                events.splice(index, 1);
                localStorage.setItem("events", JSON.stringify(events));
                displayEvents();
            });

            eventItem.appendChild(title);
            eventItem.appendChild(details);
            eventItem.appendChild(deleteBtn);
            eventList.appendChild(eventItem);
        });
    }

    updateDashboard();
    displayTodaySchedule();
}

const addAssignmentBtn = document.getElementById("add-assignment-btn");
const assignmentForm = document.getElementById("assignment-form");
const assignmentList = document.getElementById("assignment-list");

let assignments = loadStoredArray("assignments");

let assignmentsChanged = false;

assignments.forEach((assignment) => {
    if (!assignment.id) {
        assignment.id = createId();
        assignmentsChanged = true;
    }
});

if (assignmentsChanged) {
    localStorage.setItem("assignments", JSON.stringify(assignments));
}

addAssignmentBtn.addEventListener("click", () => {
    assignmentForm.hidden = !assignmentForm.hidden;
});

assignmentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("assignment-name").value.trim();
    const course = document.getElementById("assignment-course").value.trim();
    const due = document.getElementById("assignment-due").value;
    const hours = Number(document.getElementById("assignment-hours").value);
    const progress = Number(document.getElementById("assignment-progress").value);

    if (
        !name ||
        !course ||
        !due ||
        !Number.isFinite(hours) ||
        hours <= 0 ||
        !Number.isFinite(progress) ||
        progress < 0 ||
        progress > 100
    ) {
        alert("Please enter valid assignment information.");
        return;
    }

    assignments.push({
        id: createId(),
        name,
        course,
        due,
        hours,
        progress
    });

    saveAssignments();

    assignmentForm.reset();
    assignmentForm.hidden = true;
});

function saveAssignments() {
    localStorage.setItem("assignments", JSON.stringify(assignments));
    displayAssignments();
    displaySavedPlan();
}

function updateAssignmentProgress(assignmentId) {
    const assignment = assignments.find((item) => item.id === assignmentId);

    if (!assignment) {
        alert("This assignment no longer exists.");
        return;
    }

    const input = prompt(
        "Enter overall assignment progress (0-100):",
        assignment.progress
    );

    if (input === null) {
        return;
    }

    const value = Number(input);

    if (
        input.trim() === "" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100
    ) {
        alert("Please enter a number between 0 and 100.");
        return;
    }

    assignment.progress = value;
    saveAssignments();
}

function displayAssignments() {
    assignmentList.innerHTML = "";

    if (assignments.length === 0) {
        assignmentList.textContent = "No assignments added yet.";
        updateDashboard();
        displayUpcomingDeadlines();
        return;
    }

    const sortedAssignments = [...assignments].sort(
        (a, b) => a.due.localeCompare(b.due)
    );

    sortedAssignments.forEach((assignment) => {
        const assignmentItem = document.createElement("div");
        assignmentItem.className = "assignment-item";

        const daysLeft = getDaysBetween(
            getLocalDateString(),
            assignment.due
        );

        const title = document.createElement("strong");
        title.textContent = assignment.name;

        const details = document.createElement("p");
        details.textContent =
            `${assignment.course} | Due: ${assignment.due} | ` +
            `Estimated: ${assignment.hours} hours | ` +
            `Progress: ${assignment.progress}%`;

        const deadlineText = document.createElement("p");

        if (daysLeft < 0) {
            deadlineText.textContent =
                `${Math.abs(daysLeft)} days overdue`;
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

        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";

        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";
        progressFill.style.width = `${assignment.progress}%`;

        progressBar.appendChild(progressFill);

        const progressBtn = document.createElement("button");
        progressBtn.type = "button";
        progressBtn.textContent = "Update Progress";
        progressBtn.className = "progress-btn";

        progressBtn.addEventListener("click", () => {
            updateAssignmentProgress(assignment.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";

        deleteBtn.addEventListener("click", () => {
            if (!confirm(`Delete "${assignment.name}"?`)) {
                return;
            }

            assignments = assignments.filter(
                (item) => item.id !== assignment.id
            );

            saveAssignments();
        });

        assignmentItem.appendChild(title);
        assignmentItem.appendChild(details);
        assignmentItem.appendChild(deadlineText);
        assignmentItem.appendChild(progressBar);
        assignmentItem.appendChild(progressBtn);
        assignmentItem.appendChild(deleteBtn);

        assignmentList.appendChild(assignmentItem);
    });

    updateDashboard();
    displayUpcomingDeadlines();
}

function updateDashboard() {
    const pendingAssignments = assignments.filter(
        (assignment) => assignment.progress < 100
    );

    document.getElementById("pending-count").textContent =
        pendingAssignments.length;

    const totalHours = assignments.reduce((total, assignment) => {
        return total + assignment.hours * (1 - assignment.progress / 100);
    }, 0);

    document.getElementById("remaining-hours").textContent =
        totalHours.toFixed(1);

    const totalProgress = assignments.reduce((total, assignment) => {
        return total + assignment.progress;
    }, 0);

    const averageProgress = assignments.length > 0
        ? totalProgress / assignments.length
        : 0;

    document.getElementById("overall-progress").textContent =
        `${Math.round(averageProgress)}%`;

    const today = getDayName(getLocalDateString());

    document.getElementById("today-events").textContent =
        events.filter((event) => event.day === today).length;
}

function displayTodaySchedule() {
    const scheduleList = document.getElementById("today-schedule");
    scheduleList.innerHTML = "";

    const today = getDayName(getLocalDateString());

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

    const today = getLocalDateString();

    const upcoming = assignments
        .filter((assignment) => {
            return assignment.progress < 100 && assignment.due >= today;
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
        details.textContent =
            `${assignment.course} | Due: ${assignment.due}`;

        item.appendChild(title);
        item.appendChild(details);
        deadlineList.appendChild(item);
    });
}

const studyDateInput = document.getElementById("study-date");
const studyStartInput = document.getElementById("study-start");
const studyEndInput = document.getElementById("study-end");
const generatePlanBtn = document.getElementById("generate-plan-btn");
const planList = document.getElementById("study-plan-list");
const planMessage = document.getElementById("plan-message");

let savedPlans = loadStoredObject("dailyPlans");

studyDateInput.value = getLocalDateString();

studyStartInput.value =
    localStorage.getItem("studyStart") || "09:00";

studyEndInput.value =
    localStorage.getItem("studyEnd") || "22:00";

studyStartInput.addEventListener("change", () => {
    localStorage.setItem("studyStart", studyStartInput.value);
});

studyEndInput.addEventListener("change", () => {
    localStorage.setItem("studyEnd", studyEndInput.value);
});

studyDateInput.addEventListener("change", () => {
    planMessage.textContent = "";
});

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return (
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}`
    );
}

function getAvailableStudySlots(startTime, endTime, dateString) {
    const selectedDay = getDayName(dateString);

    const selectedEvents = events
        .filter((event) => event.day === selectedDay)
        .sort((a, b) => a.start.localeCompare(b.start));

    const availableSlots = [];
    let currentTime = startTime;

    selectedEvents.forEach((event) => {
        if (event.end <= startTime || event.start >= endTime) {
            return;
        }

        const eventStart = event.start > startTime
            ? event.start
            : startTime;

        const eventEnd = event.end < endTime
            ? event.end
            : endTime;

        if (eventStart > currentTime) {
            availableSlots.push({
                start: currentTime,
                end: eventStart
            });
        }

        if (eventEnd > currentTime) {
            currentTime = eventEnd;
        }
    });

    if (currentTime < endTime) {
        availableSlots.push({
            start: currentTime,
            end: endTime
        });
    }

    return availableSlots;
}

function getPrioritizedAssignments(dateString) {
    return assignments
        .filter((assignment) => {
            return assignment.progress < 100;
        })
        .map((assignment) => {
            const daysLeft = getDaysBetween(
                dateString,
                assignment.due
            );

            const remainingHours =
                assignment.hours * (1 - assignment.progress / 100);

            const urgency = Math.max(daysLeft + 1, 1);
            const priorityScore = remainingHours / urgency;

            return {
                ...assignment,
                daysLeft,
                remainingHours,
                priorityScore
            };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore);
}

function generateStudyPlan(availableSlots, prioritizedAssignments) {
    const studyPlan = [];

    const studyDuration = Number(
        localStorage.getItem("sessionDuration") ?? 90
    );

    const breakDuration = Number(
        localStorage.getItem("breakDuration") ?? 15
    );

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
                    studyDuration,
                    task.remainingMinutes,
                    availableMinutes
                );

                if (sessionMinutes <= 0) {
                    break;
                }

                studyPlan.push({
                    id: createId(),
                    type: "study",
                    assignmentId: task.id,
                    name: task.name,
                    course: task.course,
                    start: minutesToTime(currentTime),
                    end: minutesToTime(currentTime + sessionMinutes),
                    duration: sessionMinutes,
                    completed: false
                });

                currentTime += sessionMinutes;
                task.remainingMinutes -= sessionMinutes;

                const hasRemainingWork = tasks.some(
                    (item) => item.remainingMinutes > 0
                );

                if (
                    sessionMinutes === studyDuration &&
                    hasRemainingWork &&
                    breakDuration > 0 &&
                    currentTime + breakDuration < slotEnd
                ) {
                    studyPlan.push({
                        id: createId(),
                        type: "break",
                        name: "Break ☕",
                        start: minutesToTime(currentTime),
                        end: minutesToTime(currentTime + breakDuration),
                        duration: breakDuration
                    });

                    currentTime += breakDuration;
                }
            }

            if (currentTime >= slotEnd) {
                break;
            }
        }
    }

    return studyPlan;
}

function saveDailyPlans() {
    localStorage.setItem("dailyPlans", JSON.stringify(savedPlans));
}

generatePlanBtn.addEventListener("click", () => {
    const dateString = studyDateInput.value;
    const startTime = studyStartInput.value;
    const endTime = studyEndInput.value;

    if (!dateString) {
        alert("Please select a study date.");
        return;
    }

    if (!startTime || !endTime) {
        alert("Please select your available study time.");
        return;
    }

    if (endTime <= startTime) {
        alert("End time must be after start time.");
        return;
    }

    const existingPlan = savedPlans[dateString];

    if (existingPlan) {
        const shouldReplace = confirm(
            `A plan is already saved for ${dateString}.\n` +
            "Generate a new plan and replace the existing one?\n" +
            "Your saved checkboxes and notes for this date will be reset."
        );

        if (!shouldReplace) {
            return;
        }
    }

    const availableSlots = getAvailableStudySlots(
        startTime,
        endTime,
        dateString
    );

    const prioritizedAssignments =
        getPrioritizedAssignments(dateString);

    if (availableSlots.length === 0) {
        planMessage.textContent =
            "No available study time for this date.";
        return;
    }

    if (prioritizedAssignments.length === 0) {
        planMessage.textContent =
            "No pending assignments to schedule.";
        return;
    }

    const studyPlan = generateStudyPlan(
        availableSlots,
        prioritizedAssignments
    );

    if (studyPlan.length === 0) {
        planMessage.textContent =
            "No study sessions could be generated.";
        return;
    }

    savedPlans[dateString] = {
        date: dateString,
        startTime,
        endTime,
        sessions: studyPlan
    };

    saveDailyPlans();

    planMessage.textContent =
        `Study plan saved for ${dateString}!`;

    displaySavedPlansList();
    openPlanDetail(dateString);
});

function displaySavedPlan() {
    const dateString = studyDateInput.value;
    const savedPlan = savedPlans[dateString];
    const summary = document.getElementById("study-summary");
    const dailyNotesInput = document.getElementById("daily-notes");

    planList.innerHTML = "";

    document.getElementById("study-plan-heading").textContent =
        dateString ? `Study Plan — ${dateString}` : "Study Plan";

    if (
        !savedPlan ||
        !Array.isArray(savedPlan.sessions) ||
        savedPlan.sessions.length === 0
    ) {
        planList.textContent = "No study sessions found.";
        summary.hidden = true;
        dailyNotesInput.value = "";
        return;
    }

    dailyNotesInput.value = savedPlan.notes || "";

    savedPlan.sessions.forEach((session) => {
        const sessionItem = document.createElement("div");
        sessionItem.className = "event-item";

        const title = document.createElement("strong");
        title.className = "session-title";
        title.textContent = session.name;

        const details = document.createElement("p");
        details.className = "session-details";

        if (session.type === "break") {
            sessionItem.classList.add("break-session");

            details.textContent =
                `${session.start} - ${session.end} | ${session.duration} min break`;

            sessionItem.appendChild(title);
            sessionItem.appendChild(details);
            planList.appendChild(sessionItem);
            return;
        }

        sessionItem.classList.add("study-session");

        if (session.completed) {
            sessionItem.classList.add("completed");
        }

        details.textContent =
            `${session.start} - ${session.end} | ${session.course} | ${session.duration} min`;

        sessionItem.appendChild(title);
        sessionItem.appendChild(details);

        const checkboxLabel = document.createElement("label");
        checkboxLabel.className = "session-check";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(session.completed);

        const checkboxText = document.createElement("span");
        checkboxText.textContent = "Study session completed";

        checkbox.addEventListener("change", () => {
            session.completed = checkbox.checked;
            saveDailyPlans();

            sessionItem.classList.toggle("completed", session.completed);
            displayStudySummary(savedPlan.sessions);
            displaySavedPlansList();
        });

        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(checkboxText);
        sessionItem.appendChild(checkboxLabel);

        const assignment = assignments.find(
            (item) => item.id === session.assignmentId
        );

        const progressSection = document.createElement("div");
        progressSection.className = "session-progress";

        if (assignment) {
            const progressLabel = document.createElement("span");
            progressLabel.className = "session-progress-label";
            progressLabel.textContent =
                `Overall Assignment Progress: ${assignment.progress}%`;

            const progressBar = document.createElement("div");
            progressBar.className = "progress-bar";

            const progressFill = document.createElement("div");
            progressFill.className = "progress-fill";
            progressFill.style.width = `${assignment.progress}%`;

            progressBar.appendChild(progressFill);

            const progressBtn = document.createElement("button");
            progressBtn.type = "button";
            progressBtn.className = "progress-btn";
            progressBtn.textContent = "Update Progress";

            progressBtn.addEventListener("click", () => {
                updateAssignmentProgress(assignment.id);
            });

            progressSection.appendChild(progressLabel);
            progressSection.appendChild(progressBar);
            progressSection.appendChild(progressBtn);
        } else {
            const missingText = document.createElement("p");
            missingText.className = "session-progress-note";
            missingText.textContent =
                "This assignment was deleted. Its study record is preserved.";

            progressSection.appendChild(missingText);
        }

        sessionItem.appendChild(progressSection);

        const notesSection = document.createElement("div");
        notesSection.className = "session-notes";

        const notesLabel = document.createElement("label");
        notesLabel.textContent = "Session Notes";

        const notesInput = document.createElement("textarea");
        notesInput.className = "notes-input";
        notesInput.rows = 3;
        notesInput.placeholder =
            "Add specific tasks, goals, or reminders for this session...";
        notesInput.value = session.notes || "";

        notesInput.addEventListener("input", () => {
            session.notes = notesInput.value;
            saveDailyPlans();
        });

        notesSection.appendChild(notesLabel);
        notesSection.appendChild(notesInput);

        sessionItem.appendChild(notesSection);
        planList.appendChild(sessionItem);
    });

    displayStudySummary(savedPlan.sessions);
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

    const completedCount = studySessions.filter(
        (session) => session.completed
    ).length;

    const totalCount = studySessions.length;

    const completion = totalCount > 0
        ? Math.round((completedCount / totalCount) * 100)
        : 0;

    document.getElementById("total-study-time").textContent =
        `${(totalStudyMinutes / 60).toFixed(1)} hours`;

    document.getElementById("study-session-count").textContent =
        totalCount;

    document.getElementById("total-break-time").textContent =
        `${totalBreakMinutes} minutes`;

    document.getElementById("completed-session-count").textContent =
        `${completedCount} / ${totalCount}`;

    document.getElementById("daily-completion").textContent =
        `${completion}%`;

    document.getElementById("daily-completion-fill").style.width =
        `${completion}%`;

    document.getElementById("daily-completion-bar").setAttribute(
        "aria-valuenow",
        String(completion)
    );

    summary.hidden = false;
}

const sessionDurationInput = document.getElementById("session-duration");
const breakDurationInput = document.getElementById("break-duration");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const settingsMessage = document.getElementById("settings-message");

sessionDurationInput.value =
    localStorage.getItem("sessionDuration") ?? "90";

breakDurationInput.value =
    localStorage.getItem("breakDuration") ?? "15";

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

    localStorage.setItem("sessionDuration", String(sessionDuration));
    localStorage.setItem("breakDuration", String(breakDuration));

    settingsMessage.textContent = "Settings saved successfully!";
});

function displaySavedPlansList() {
    const savedPlansList = document.getElementById("saved-plans-list");
    savedPlansList.innerHTML = "";

    const dates = Object.keys(savedPlans)
        .filter((date) => Array.isArray(savedPlans[date]?.sessions))
        .sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) {
        savedPlansList.textContent = "No saved plans yet.";
        return;
    }

    dates.forEach((date) => {
        const plan = savedPlans[date];

        const studySessions = plan.sessions.filter(
            (session) => session.type === "study"
        );

        const completedCount = studySessions.filter(
            (session) => session.completed
        ).length;

        const completion = studySessions.length > 0
            ? Math.round((completedCount / studySessions.length) * 100)
            : 0;

        const planItem = document.createElement("div");
        planItem.className = "saved-plan-item";

        const planInfo = document.createElement("div");
        planInfo.className = "saved-plan-info";

        const dateTitle = document.createElement("strong");
        dateTitle.textContent = date;

        const completionText = document.createElement("p");
        completionText.textContent =
            `${completion}% completed (${completedCount}/${studySessions.length} sessions)`;

        const notePreview = document.createElement("p");
        notePreview.className = "saved-plan-note";

        const notes = (plan.notes || "").trim();

        notePreview.textContent = notes
            ? `📝 ${notes.length > 100 ? notes.slice(0, 100) + "..." : notes}`
            : "📝 No notes yet";

        planInfo.appendChild(dateTitle);
        planInfo.appendChild(completionText);
        planInfo.appendChild(notePreview);

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "progress-btn";
        viewBtn.textContent = "View Plan";

        viewBtn.addEventListener("click", () => {
            openPlanDetail(date);
        });

        planItem.appendChild(planInfo);
        planItem.appendChild(viewBtn);
        savedPlansList.appendChild(planItem);
    });
}

const plannerHome = document.getElementById("planner-home");
const plannerDetail = document.getElementById("planner-detail");
const backToPlansBtn = document.getElementById("back-to-plans-btn");

function openPlanDetail(dateString) {
    if (!savedPlans[dateString]) {
        return;
    }

    studyDateInput.value = dateString;

    plannerHome.hidden = true;
    plannerDetail.hidden = false;

    displaySavedPlan();

    notesMessage.textContent = "";

    document.getElementById("planner").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showPlannerHome() {
    plannerDetail.hidden = true;
    plannerHome.hidden = false;

    displaySavedPlansList();

    document.getElementById("planner").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

backToPlansBtn.addEventListener("click", showPlannerHome);

const saveDailyNotesBtn = document.getElementById("save-daily-notes-btn");
const dailyNotesInput = document.getElementById("daily-notes");
const notesMessage = document.getElementById("notes-message");

saveDailyNotesBtn.addEventListener("click", () => {
    const dateString = studyDateInput.value;
    const plan = savedPlans[dateString];

    if (!plan) {
        notesMessage.textContent = "No saved plan found.";
        return;
    }

    plan.notes = dailyNotesInput.value;
    saveDailyPlans();
    displaySavedPlansList();

    notesMessage.textContent = "Notes saved successfully!";
});

displayEvents();
displayAssignments();
displaySavedPlansList();
showPlannerHome();