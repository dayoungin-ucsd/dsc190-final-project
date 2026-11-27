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
const cancelEventBtn = document.getElementById("cancel-event-btn");
const cancelEventFormBtn = document.getElementById("cancel-event-form-btn");
const deleteEventBtn = document.getElementById("delete-event-btn");
const eventFormTitle = document.getElementById("event-form-title");
const saveEventBtn = document.getElementById("save-event-btn");

const manageCategoriesBtn = document.getElementById("manage-categories-btn");
const categoryManager = document.getElementById("category-manager");
const closeCategoriesBtn = document.getElementById("close-categories-btn");
const categoryList = document.getElementById("category-list");
const categoryForm = document.getElementById("category-form");
const categoryFormTitle = document.getElementById("category-form-title");
const categoryNameInput = document.getElementById("category-name");
const categoryColorInput = document.getElementById("category-color");
const categoryColorValue = document.getElementById("category-color-value");
const saveCategoryBtn = document.getElementById("save-category-btn");
const cancelCategoryBtn = document.getElementById("cancel-category-btn");

const timetableTimeColumn = document.getElementById("timetable-time-column");
const timetableLegend = document.getElementById("timetable-legend");
const timetableEmpty = document.getElementById("timetable-empty");

const TIMETABLE_START = 7;
const TIMETABLE_END = 23;
const HOUR_HEIGHT = 64;

let events = loadStoredArray("events");
let categories = loadStoredArray("eventCategories");
let editingEventId = null;
let editingCategoryId = null;

const defaultCategories = [
    { id: "class", name: "Class", color: "#7161e8" },
    { id: "work", name: "Work", color: "#3a9b72" },
    { id: "personal", name: "Personal", color: "#e58ba6" }
];

if (categories.length === 0 && localStorage.getItem("eventCategories") === null) {
    categories = defaultCategories;
    localStorage.setItem("eventCategories", JSON.stringify(categories));
}

let eventsChanged = false;

events.forEach((event) => {
    if (!event.id) {
        event.id = createId();
        eventsChanged = true;
    }

    if (!event.groupId) {
        event.groupId = event.id;
        eventsChanged = true;
    }
});

if (eventsChanged) {
    localStorage.setItem("events", JSON.stringify(events));
}

function saveEvents() {
    localStorage.setItem("events", JSON.stringify(events));
    displayEvents();
}

function saveCategories() {
    localStorage.setItem("eventCategories", JSON.stringify(categories));
    displayCategories();
    updateCategoryOptions();
    displayEvents();
}

function getCategory(name) {
    return categories.find((category) => category.name === name);
}

function getCategoryColor(name) {
    return getCategory(name)?.color || "#85899c";
}

function getCategoryBackground(color) {
    const hex = color.replace("#", "");

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        return "#f1f2f6";
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, 0.16)`;
}

function updateCategoryOptions() {
    const select = document.getElementById("event-category");
    const selectedValue = select.value;

    select.innerHTML = "";

    const uncategorizedOption = document.createElement("option");
    uncategorizedOption.value = "Uncategorized";
    uncategorizedOption.textContent = "Uncategorized";
    select.appendChild(uncategorizedOption);

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });

    if ([...select.options].some((option) => option.value === selectedValue)) {
        select.value = selectedValue;
    } else if (categories.length > 0) {
        select.value = categories[0].name;
    }
}

function getSelectedEventDays() {
    return [...document.querySelectorAll('input[name="event-days"]:checked')]
        .map((checkbox) => checkbox.value);
}

function setSelectedEventDays(selectedDays) {
    document.querySelectorAll('input[name="event-days"]').forEach((checkbox) => {
        checkbox.checked = selectedDays.includes(checkbox.value);
    });
}

function resetEventForm() {
    eventForm.reset();
    editingEventId = null;
    eventFormTitle.textContent = "Add New Event";
    saveEventBtn.textContent = "Save Event";
    deleteEventBtn.hidden = true;
    updateCategoryOptions();
}

function closeEventForm() {
    eventForm.hidden = true;
    resetEventForm();
}

function openAddEventForm() {
    resetEventForm();
    eventForm.hidden = false;
    eventForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openEditEventForm(eventId) {
    const event = events.find((item) => item.id === eventId);

    if (!event) {
        return;
    }

    editingEventId = event.id;

    const groupEvents = events.filter(
        (item) => item.groupId === event.groupId
    );

    document.getElementById("event-name").value = event.name;
    document.getElementById("event-start").value = event.start;
    document.getElementById("event-end").value = event.end;

    updateCategoryOptions();
    document.getElementById("event-category").value = event.category;

    setSelectedEventDays(groupEvents.map((item) => item.day));

    eventFormTitle.textContent = "Edit Event";
    saveEventBtn.textContent = "Save Changes";
    deleteEventBtn.hidden = false;
    eventForm.hidden = false;

    eventForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

addEventBtn.addEventListener("click", () => {
    if (eventForm.hidden) {
        openAddEventForm();
    } else {
        closeEventForm();
    }
});

cancelEventBtn.addEventListener("click", closeEventForm);
cancelEventFormBtn.addEventListener("click", closeEventForm);

eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("event-name").value.trim();
    const selectedDays = getSelectedEventDays();
    const start = document.getElementById("event-start").value;
    const end = document.getElementById("event-end").value;
    const category = document.getElementById("event-category").value;

    if (!name || selectedDays.length === 0 || !start || !end || end <= start) {
        alert("Please enter valid event information and select at least one day.");
        return;
    }

    if (start < "07:00" || end > "23:00") {
        alert("Please choose a time between 7:00 AM and 11:00 PM.");
        return;
    }

    const originalEvent = editingEventId
        ? events.find((event) => event.id === editingEventId)
        : null;

    const groupId = originalEvent?.groupId || createId();

    const conflictingDays = selectedDays.filter((day) => {
        return events.some((event) => {
            return (
                event.groupId !== groupId &&
                event.day === day &&
                start < event.end &&
                end > event.start
            );
        });
    });

    if (conflictingDays.length > 0) {
        alert(
            `This event overlaps with another event on: ${conflictingDays.join(", ")}.`
        );
        return;
    }

    const existingGroupEvents = events.filter(
        (event) => event.groupId === groupId
    );

    const updatedGroupEvents = selectedDays.map((day) => {
        const existing = existingGroupEvents.find((event) => event.day === day);

        return {
            id: existing?.id || createId(),
            groupId,
            name,
            day,
            start,
            end,
            category
        };
    });

    events = events
        .filter((event) => event.groupId !== groupId)
        .concat(updatedGroupEvents);

    saveEvents();
    closeEventForm();
});

deleteEventBtn.addEventListener("click", () => {
    const event = events.find((item) => item.id === editingEventId);

    if (!event) {
        return;
    }

    if (!confirm(`Delete "${event.name}" from all selected days?`)) {
        return;
    }

    events = events.filter((item) => item.groupId !== event.groupId);
    saveEvents();
    closeEventForm();
});

function displayTimetableTimeLabels() {
    timetableTimeColumn.innerHTML = "";

    const header = document.createElement("div");
    header.className = "timetable-time-header";
    timetableTimeColumn.appendChild(header);

    const labels = document.createElement("div");
    labels.className = "timetable-time-labels";

    for (let hour = TIMETABLE_START; hour <= TIMETABLE_END; hour++) {
        const label = document.createElement("div");
        label.className = "timetable-time-label";

        const displayHour = hour % 12 || 12;
        const period = hour < 12 ? "AM" : "PM";

        label.textContent = `${displayHour} ${period}`;
        label.style.top = `${(hour - TIMETABLE_START) * HOUR_HEIGHT}px`;

        labels.appendChild(label);
    }

    timetableTimeColumn.appendChild(labels);
}

function displayTimetableLegend() {
    timetableLegend.innerHTML = "";

    categories.forEach((category) => {
        const item = document.createElement("div");
        item.className = "legend-item";

        const dot = document.createElement("span");
        dot.className = "legend-dot";
        dot.style.backgroundColor = category.color;

        const name = document.createElement("span");
        name.textContent = category.name;

        item.appendChild(dot);
        item.appendChild(name);
        timetableLegend.appendChild(item);
    });
}

function displayWeeklyTimetable() {
    document.querySelectorAll(".timetable-day-events").forEach((column) => {
        column.innerHTML = "";
    });

    timetableEmpty.hidden = events.length > 0;

    events.forEach((event) => {
        const columnId = `timetable-${event.day.toLowerCase()}`;
        const column = document.getElementById(columnId);

        if (!column) {
            return;
        }

        const startMinutes = timeToMinutes(event.start);
        const endMinutes = timeToMinutes(event.end);
        const timetableStartMinutes = TIMETABLE_START * 60;
        const timetableEndMinutes = TIMETABLE_END * 60;

        const visibleStart = Math.max(startMinutes, timetableStartMinutes);
        const visibleEnd = Math.min(endMinutes, timetableEndMinutes);

        if (visibleEnd <= visibleStart) {
            return;
        }

        const top = (visibleStart - timetableStartMinutes) / 60 * HOUR_HEIGHT;
        const height = (visibleEnd - visibleStart) / 60 * HOUR_HEIGHT;

        const color = getCategoryColor(event.category);

        const eventBlock = document.createElement("button");
        eventBlock.type = "button";
        eventBlock.className = "timetable-event";
        eventBlock.style.top = `${top}px`;
        eventBlock.style.height = `${height}px`;
        eventBlock.style.setProperty("--event-color", color);
        eventBlock.style.setProperty(
            "--event-background",
            getCategoryBackground(color)
        );

        const title = document.createElement("span");
        title.className = "timetable-event-title";
        title.textContent = event.name;

        const time = document.createElement("span");
        time.className = "timetable-event-time";
        time.textContent = `${event.start} - ${event.end}`;

        const category = document.createElement("span");
        category.className = "timetable-event-category";
        category.textContent = event.category;

        eventBlock.appendChild(title);
        eventBlock.appendChild(time);
        eventBlock.appendChild(category);

        eventBlock.title =
            `${event.name}\n${event.day}\n${event.start} - ${event.end}\n${event.category}`;

        eventBlock.addEventListener("click", () => {
            openEditEventForm(event.id);
        });

        column.appendChild(eventBlock);
    });
}

function displayEvents() {
    eventList.innerHTML = "";

    if (events.length === 0) {
        eventList.textContent = "No recurring events added yet.";
    } else {
        const sortedEvents = [...events].sort((a, b) => {
            const dayDifference = days.indexOf(a.day) - days.indexOf(b.day);

            return dayDifference || a.start.localeCompare(b.start);
        });

        sortedEvents.forEach((event) => {
            const item = document.createElement("div");
            item.className = "event-list-item";

            const color = getCategoryColor(event.category);
            item.style.setProperty("--event-color", color);

            const info = document.createElement("div");
            info.className = "event-list-info";

            const title = document.createElement("strong");
            title.textContent = event.name;

            const details = document.createElement("p");
            details.textContent =
                `${event.day} | ${event.start} - ${event.end} | ${event.category}`;

            info.appendChild(title);
            info.appendChild(details);

            const actions = document.createElement("div");
            actions.className = "event-list-actions";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "progress-btn";
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                openEditEventForm(event.id);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-btn";
            deleteBtn.textContent = "Delete";

            deleteBtn.addEventListener("click", () => {
                if (!confirm(`Delete "${event.name}" on ${event.day}?`)) {
                    return;
                }

                events = events.filter((item) => item.id !== event.id);
                saveEvents();
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(info);
            item.appendChild(actions);

            eventList.appendChild(item);
        });
    }

    displayWeeklyTimetable();
    displayTimetableLegend();
    updateDashboard();
    displayTodaySchedule();
}

function displayCategories() {
    categoryList.innerHTML = "";

    if (categories.length === 0) {
        categoryList.textContent = "No categories added yet.";
        return;
    }

    categories.forEach((category) => {
        const item = document.createElement("div");
        item.className = "category-item";

        const info = document.createElement("div");
        info.className = "category-info";

        const dot = document.createElement("span");
        dot.className = "category-color-dot";
        dot.style.backgroundColor = category.color;

        const name = document.createElement("span");
        name.className = "category-name";
        name.textContent = category.name;

        info.appendChild(dot);
        info.appendChild(name);

        const actions = document.createElement("div");
        actions.className = "category-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "progress-btn";
        editBtn.textContent = "Edit";

        editBtn.addEventListener("click", () => {
            editingCategoryId = category.id;
            categoryNameInput.value = category.name;
            categoryColorInput.value = category.color;
            categoryColorValue.textContent = category.color;
            categoryFormTitle.textContent = "Edit Category";
            saveCategoryBtn.textContent = "Save Changes";
            cancelCategoryBtn.hidden = false;

            categoryForm.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {
            if (!confirm(`Delete category "${category.name}"? Events will be kept.`)) {
                return;
            }

            events.forEach((event) => {
                if (event.category === category.name) {
                    event.category = "Uncategorized";
                }
            });

            categories = categories.filter((item) => item.id !== category.id);

            saveEvents();
            saveCategories();
            resetCategoryForm();
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);

        categoryList.appendChild(item);
    });
}

function resetCategoryForm() {
    categoryForm.reset();
    editingCategoryId = null;
    categoryColorInput.value = "#7161e8";
    categoryColorValue.textContent = "#7161e8";
    categoryFormTitle.textContent = "Add New Category";
    saveCategoryBtn.textContent = "Add Category";
    cancelCategoryBtn.hidden = true;
}

manageCategoriesBtn.addEventListener("click", () => {
    categoryManager.hidden = !categoryManager.hidden;

    if (!categoryManager.hidden) {
        displayCategories();
        categoryManager.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});

closeCategoriesBtn.addEventListener("click", () => {
    categoryManager.hidden = true;
    resetCategoryForm();
});

cancelCategoryBtn.addEventListener("click", resetCategoryForm);

categoryColorInput.addEventListener("input", () => {
    categoryColorValue.textContent = categoryColorInput.value;
});

categoryForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = categoryNameInput.value.trim();
    const color = categoryColorInput.value;

    if (!name) {
        alert("Please enter a category name.");
        return;
    }

    if (name.toLowerCase() === "uncategorized") {
        alert('"Uncategorized" is a reserved category name.');
        return;
    }

    const duplicate = categories.some((category) => {
        return (
            category.name.toLowerCase() === name.toLowerCase() &&
            category.id !== editingCategoryId
        );
    });

    if (duplicate) {
        alert("A category with this name already exists.");
        return;
    }

    if (editingCategoryId) {
        const category = categories.find(
            (item) => item.id === editingCategoryId
        );

        if (category) {
            const oldName = category.name;

            category.name = name;
            category.color = color;

            events.forEach((event) => {
                if (event.category === oldName) {
                    event.category = name;
                }
            });

            saveEvents();
        }
    } else {
        categories.push({
            id: createId(),
            name,
            color
        });
    }

    saveCategories();
    resetCategoryForm();
});

displayTimetableTimeLabels();
updateCategoryOptions();
displayCategories();

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