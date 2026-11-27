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

    if (!plannerHome.hidden) {
        displayDailyWeeklyEvents();
        displayAvailabilityGrid();
    }
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
        const eventGroups = new Map();

        events.forEach((event) => {
            const groupId = event.groupId || event.id;

            if (!eventGroups.has(groupId)) {
                eventGroups.set(groupId, []);
            }

            eventGroups.get(groupId).push(event);
        });

        const sortedGroups = [...eventGroups.values()].sort((a, b) => {
            const firstDayA = Math.min(
                ...a.map((event) => days.indexOf(event.day))
            );

            const firstDayB = Math.min(
                ...b.map((event) => days.indexOf(event.day))
            );

            return firstDayA - firstDayB ||
                a[0].start.localeCompare(b[0].start);
        });

        sortedGroups.forEach((group) => {
            const event = group[0];

            const selectedDays = group
                .map((item) => item.day)
                .sort((a, b) => days.indexOf(a) - days.indexOf(b));

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
                `${selectedDays.join(", ")} | ${event.start} - ${event.end} | ${event.category}`;

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
                if (!confirm(
                    `Delete "${event.name}" on ${selectedDays.join(", ")}?`
                )) {
                    return;
                }

                events = events.filter(
                    (item) => item.groupId !== event.groupId
                );

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

    if (activePlanDate) {
        const plan = getActivePlan();

        if (plan && dailyNotesInput.value !== (plan.notes || "")) {
            if (confirm("Save your Daily Notes before refreshing the plan?")) {
                plan.notes = dailyNotesInput.value;
                saveDailyPlans();
            }
        }

        displaySavedPlan();
    }

    displayDashboardStudyPlan();
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

const plannerHome = document.getElementById("planner-home");
const plannerDetail = document.getElementById("planner-detail");
const backToPlansBtn = document.getElementById("back-to-plans-btn");

const availabilityCard = document.querySelector(".daily-availability-card");
const availabilitySummaryText = document.getElementById("availability-summary-text");
const editAvailabilityBtn = document.getElementById("edit-availability-btn");
const saveAvailabilityBtn = document.getElementById("save-availability-btn");
const cancelAvailabilityBtn = document.getElementById("cancel-availability-btn");

let availabilitySnapshot = null;

const availabilityGrid = document.getElementById("availability-grid");
const clearUnavailableBtn = document.getElementById("clear-unavailable-btn");
const unavailableReasonInput = document.getElementById("unavailable-reason");
const applyUnavailableReasonBtn = document.getElementById("apply-unavailable-reason-btn");
const dailyWeeklyEventsList = document.getElementById("daily-weekly-events-list");

const dailyTimetableTimeColumn = document.getElementById("daily-timetable-time-column");
const dailyTimetableEvents = document.getElementById("daily-timetable-events");
const editPlanAvailabilityBtn = document.getElementById("edit-plan-availability-btn");

const addStudySessionBtn = document.getElementById("add-study-session-btn");
const studySessionForm = document.getElementById("study-session-form");
const studySessionFormTitle = document.getElementById("study-session-form-title");
const sessionAssignmentInput = document.getElementById("session-assignment");
const sessionStartInput = document.getElementById("session-start-time");
const sessionEndInput = document.getElementById("session-end-time");
const saveStudySessionBtn = document.getElementById("save-study-session-btn");
const deleteStudySessionBtn = document.getElementById("delete-study-session-btn");
const cancelStudySessionBtn = document.getElementById("cancel-study-session-btn");
const closeStudySessionFormBtn = document.getElementById("close-study-session-form-btn");
const studySessionMessage = document.getElementById("study-session-message");

const saveDailyNotesBtn = document.getElementById("save-daily-notes-btn");
const dailyNotesInput = document.getElementById("daily-notes");
const notesMessage = document.getElementById("notes-message");

const dashboardStudyDate = document.getElementById("dashboard-study-date");
const dashboardNoPlan = document.getElementById("dashboard-no-plan");
const dashboardExistingPlan = document.getElementById("dashboard-existing-plan");
const dashboardViewPlanBtn = document.getElementById("dashboard-view-plan-btn");
const dashboardCreatePlanBtn = document.getElementById("dashboard-create-plan-btn");
const dashboardDailyProgress = document.getElementById("dashboard-daily-progress");
const dashboardDailyProgressBar = document.getElementById("dashboard-daily-progress-bar");
const dashboardDailyProgressFill = document.getElementById("dashboard-daily-progress-fill");
const dashboardStudySessions = document.getElementById("dashboard-study-sessions");

let savedPlans = loadStoredObject("dailyPlans");

let activePlanDate = null;
let editingSessionId = null;
let availabilityDraft = {};
let excludedWeeklyDraft = [];
let selectedUnavailableBlocks = new Set();
let isDraggingAvailability = false;
let dragAvailabilityValue = false;

const DAILY_HOUR_HEIGHT = 70;

studyDateInput.value = getLocalDateString();
studyStartInput.value = localStorage.getItem("studyStart") || "09:00";
studyEndInput.value = localStorage.getItem("studyEnd") || "22:00";

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

function saveDailyPlans() {
    localStorage.setItem("dailyPlans", JSON.stringify(savedPlans));
    displaySavedPlansList();
    displayDashboardStudyPlan();
}

function getStudySessions(sessions) {
    return sessions.filter((session) => session.type === "study");
}

function getPlanCompletion(sessions) {
    const studySessions = getStudySessions(sessions);

    if (studySessions.length === 0) {
        return 0;
    }

    const completed = studySessions.filter(
        (session) => session.completed
    ).length;

    return Math.round(completed / studySessions.length * 100);
}

function getWeeklyEventsForDate(dateString) {
    const day = getDayName(dateString);

    return events
        .filter((event) => event.day === day)
        .sort((a, b) => a.start.localeCompare(b.start));
}

function getIncludedWeeklyEvents(dateString, excludedIds = []) {
    return getWeeklyEventsForDate(dateString).filter(
        (event) => !excludedIds.includes(event.id)
    );
}

function getAvailabilityStorageKey(dateString) {
    return `availabilityDraft-${dateString}`;
}

function loadAvailabilityDraft() {
    const dateString = studyDateInput.value;

    if (!dateString) {
        availabilityDraft = {};
        excludedWeeklyDraft = [];
        return;
    }

    const savedPlan = savedPlans[dateString];
    const storageKey = getAvailabilityStorageKey(dateString);
    const savedDraft = localStorage.getItem(storageKey);

    if (savedDraft !== null) {
        const draft = loadStoredObject(storageKey);

        availabilityDraft = { ...(draft.unavailableBlocks || {}) };
        excludedWeeklyDraft = [...(draft.excludedWeeklyEvents || [])];
    } else if (savedPlan) {
        availabilityDraft = { ...(savedPlan.unavailableBlocks || {}) };
        excludedWeeklyDraft = [...(savedPlan.excludedWeeklyEvents || [])];
    } else {
        availabilityDraft = {};
        excludedWeeklyDraft = [];
    }const availabilityGrid = document.getElementById("availability-grid");

    if (savedPlan) {
        studyStartInput.value = savedPlan.startTime || studyStartInput.value;
        studyEndInput.value = savedPlan.endTime || studyEndInput.value;
    }

    selectedUnavailableBlocks.clear();
}

function saveAvailabilityDraft() {
    const dateString = studyDateInput.value;

    if (!dateString) {
        return;
    }

    localStorage.setItem(
        getAvailabilityStorageKey(dateString),
        JSON.stringify({
            unavailableBlocks: availabilityDraft,
            excludedWeeklyEvents: excludedWeeklyDraft
        })
    );
}

function getWeeklyEventAtTime(start, end, dateString, excludedIds) {
    return getIncludedWeeklyEvents(dateString, excludedIds).find((event) => {
        return start < event.end && end > event.start;
    });
}

function getBlockStartTimes(startTime, endTime) {
    const starts = [];
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return starts;
    }

    for (
        let minute = Math.floor(start / 10) * 10;
        minute < end;
        minute += 10
    ) {
        starts.push(minute);
    }

    return starts;
}

function displayDailyWeeklyEvents() {
    dailyWeeklyEventsList.innerHTML = "";

    const dateString = studyDateInput.value;

    if (!dateString) {
        dailyWeeklyEventsList.textContent = "Select a date first.";
        return;
    }

    const dailyEvents = getWeeklyEventsForDate(dateString);

    if (dailyEvents.length === 0) {
        dailyWeeklyEventsList.textContent =
            "No recurring events for this date.";
        return;
    }

    dailyEvents.forEach((event) => {
        const item = document.createElement("div");
        item.className = "daily-weekly-event-item";
        item.style.setProperty(
            "--event-color",
            getCategoryColor(event.category)
        );

        const info = document.createElement("div");
        info.className = "daily-weekly-event-info";

        const title = document.createElement("strong");
        title.textContent = event.name;

        const details = document.createElement("p");
        details.textContent =
            `${event.start} - ${event.end} | ${event.category}`;

        info.appendChild(title);
        info.appendChild(details);

        const label = document.createElement("label");
        label.className = "daily-weekly-event-toggle";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !excludedWeeklyDraft.includes(event.id);

        const text = document.createElement("span");
        text.textContent = "Include";

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                excludedWeeklyDraft = excludedWeeklyDraft.filter(
                    (id) => id !== event.id
                );
            } else if (!excludedWeeklyDraft.includes(event.id)) {
                excludedWeeklyDraft.push(event.id);
            }

            displayAvailabilityGrid();
        });

        label.appendChild(checkbox);
        label.appendChild(text);

        item.appendChild(info);
        item.appendChild(label);

        dailyWeeklyEventsList.appendChild(item);
    });
}

function updateAvailabilityCell(cell, blockKey, dateString) {
    const start = blockKey;
    const end = minutesToTime(timeToMinutes(start) + 10);

    const weeklyEvent = getWeeklyEventAtTime(
        start,
        end,
        dateString,
        excludedWeeklyDraft
    );

    const block = availabilityDraft[blockKey];

    cell.className = "availability-cell";
    cell.innerHTML = "";

    if (weeklyEvent) {
        cell.classList.add("weekly-event");
        cell.title = `${weeklyEvent.name} (${weeklyEvent.start} - ${weeklyEvent.end})`;
        cell.setAttribute("aria-label", `${start}: ${weeklyEvent.name}`);
        return;
    }

    if (block) {
        cell.classList.add("unavailable");
        cell.title = block.reason || "Unavailable";

        if (block.reason) {
            const reason = document.createElement("span");
            reason.className = "cell-reason";
            reason.textContent = block.reason;
            cell.appendChild(reason);
        }
    } else {
        cell.title = "Available";
    }

    if (selectedUnavailableBlocks.has(blockKey)) {
        cell.classList.add("selected");
    }

    cell.setAttribute(
        "aria-label",
        `${start}: ${block ? "Unavailable" : "Available"}`
    );
}

function setAvailabilityBlock(blockKey, unavailable) {
    const dateString = studyDateInput.value;
    const blockEnd = minutesToTime(timeToMinutes(blockKey) + 10);

    if (getWeeklyEventAtTime(
        blockKey,
        blockEnd,
        dateString,
        excludedWeeklyDraft
    )) {
        return;
    }

    if (unavailable) {
        availabilityDraft[blockKey] = {
            reason: availabilityDraft[blockKey]?.reason || ""
        };

        selectedUnavailableBlocks.add(blockKey);
    } else {
        delete availabilityDraft[blockKey];
        selectedUnavailableBlocks.delete(blockKey);
    }

    const cell = availabilityGrid.querySelector(
        `[data-time="${blockKey}"]`
    );

    if (cell) {
        updateAvailabilityCell(cell, blockKey, dateString);
    }
}

function displayAvailabilityGrid() {
    availabilityGrid.innerHTML = "";

    const dateString = studyDateInput.value;
    const startTime = studyStartInput.value;
    const endTime = studyEndInput.value;

    if (!dateString || !startTime || !endTime || endTime <= startTime) {
        availabilityGrid.textContent =
            "Please select a valid date and time range.";
        return;
    }

    const startMinute = timeToMinutes(startTime);
    const endMinute = timeToMinutes(endTime);

    const firstHour = Math.floor(startMinute / 60);
    const lastHour = Math.ceil(endMinute / 60);

    for (let hour = firstHour; hour < lastHour; hour++) {
        const row = document.createElement("div");
        row.className = "availability-grid-row";

        const hourLabel = document.createElement("div");
        hourLabel.className = "availability-hour-label";

        const displayHour = hour % 12 || 12;
        const period = hour < 12 ? "AM" : "PM";

        hourLabel.textContent = `${displayHour} ${period}`;
        row.appendChild(hourLabel);

        for (let minute = 0; minute < 60; minute += 10) {
            const blockMinute = hour * 60 + minute;
            const blockKey = minutesToTime(blockMinute);

            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "availability-cell";
            cell.dataset.time = blockKey;

            const blockEnd = blockMinute + 10;

            if (blockMinute < startMinute || blockEnd > endMinute) {
                cell.disabled = true;
                cell.style.backgroundColor = "#f1f2f6";
                cell.style.cursor = "default";
                row.appendChild(cell);
                continue;
            }

            updateAvailabilityCell(cell, blockKey, dateString);

            cell.addEventListener("pointerdown", (e) => {
                if (e.button !== 0 || cell.classList.contains("weekly-event")) {
                    return;
                }

                e.preventDefault();

                isDraggingAvailability = true;
                dragAvailabilityValue = !Boolean(availabilityDraft[blockKey]);

                setAvailabilityBlock(blockKey, dragAvailabilityValue);
            });

            cell.addEventListener("pointerenter", () => {
                if (!isDraggingAvailability) {
                    return;
                }

                setAvailabilityBlock(blockKey, dragAvailabilityValue);
            });

            cell.addEventListener("click", (e) => {
                if (e.detail === 0) {
                    setAvailabilityBlock(
                        blockKey,
                        !Boolean(availabilityDraft[blockKey])
                    );
                }
            });

            row.appendChild(cell);
        }

        availabilityGrid.appendChild(row);
    }
}

document.addEventListener("pointerup", () => {
    isDraggingAvailability = false;
});

document.addEventListener("pointercancel", () => {
    isDraggingAvailability = false;
});

availabilityGrid.addEventListener("dragstart", (e) => {
    e.preventDefault();
});

availabilityGrid.style.touchAction = "pan-y";

clearUnavailableBtn.addEventListener("click", () => {
    availabilityDraft = {};
    selectedUnavailableBlocks.clear();

    displayAvailabilityGrid();
});

applyUnavailableReasonBtn.addEventListener("click", () => {
    const reason = unavailableReasonInput.value.trim();

    if (selectedUnavailableBlocks.size === 0) {
        alert("Please select unavailable blocks first.");
        return;
    }

    selectedUnavailableBlocks.forEach((blockKey) => {
        if (availabilityDraft[blockKey]) {
            availabilityDraft[blockKey].reason = reason;
        }
    });

    selectedUnavailableBlocks.clear();
    unavailableReasonInput.value = "";

    displayAvailabilityGrid();
});
function updateAvailabilitySummary() {
    const dateString = studyDateInput.value;

    if (!dateString) {
        availabilitySummaryText.textContent = "Select a date first.";
        return;
    }

    const unavailableCount = Object.keys(availabilityDraft).length;

    const weeklyCount = getIncludedWeeklyEvents(
        dateString,
        excludedWeeklyDraft
    ).length;

    availabilitySummaryText.textContent =
        `${studyStartInput.value} - ${studyEndInput.value} | ` +
        `${unavailableCount} unavailable blocks | ` +
        `${weeklyCount} weekly events`;
}

function openAvailabilityEditor() {
    availabilitySnapshot = {
        unavailableBlocks: JSON.parse(JSON.stringify(availabilityDraft)),
        excludedWeeklyEvents: [...excludedWeeklyDraft]
    };

    availabilityCard.hidden = false;

    displayDailyWeeklyEvents();
    displayAvailabilityGrid();

    availabilityCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function closeAvailabilityEditor() {
    availabilityCard.hidden = true;
    availabilitySnapshot = null;
}

editAvailabilityBtn.addEventListener("click", openAvailabilityEditor);

saveAvailabilityBtn.addEventListener("click", () => {
    saveAvailabilityDraft();

    selectedUnavailableBlocks.clear();

    updateAvailabilitySummary();
    closeAvailabilityEditor();
});

cancelAvailabilityBtn.addEventListener("click", () => {
    if (availabilitySnapshot) {
        availabilityDraft = availabilitySnapshot.unavailableBlocks;
        excludedWeeklyDraft = availabilitySnapshot.excludedWeeklyEvents;
    }

    selectedUnavailableBlocks.clear();

    updateAvailabilitySummary();
    closeAvailabilityEditor();
});

function refreshAvailabilityEditor() {
    loadAvailabilityDraft();
    displayDailyWeeklyEvents();
    displayAvailabilityGrid();
    updateAvailabilitySummary();
    closeAvailabilityEditor();
}

studyDateInput.addEventListener("change", () => {
    planMessage.textContent = "";
    refreshAvailabilityEditor();
});

studyStartInput.addEventListener("change", () => {
    localStorage.setItem("studyStart", studyStartInput.value);
    displayAvailabilityGrid();
    updateAvailabilitySummary();
});

studyEndInput.addEventListener("change", () => {
    localStorage.setItem("studyEnd", studyEndInput.value);
    displayAvailabilityGrid();
    updateAvailabilitySummary();
});

function mergeUnavailableBlocks(blocks) {
    const entries = Object.keys(blocks)
        .filter((key) => blocks[key])
        .sort((a, b) => a.localeCompare(b));

    const ranges = [];

    entries.forEach((start) => {
        const end = minutesToTime(timeToMinutes(start) + 10);
        const reason = blocks[start].reason || "";

        const previous = ranges[ranges.length - 1];

        if (previous && previous.end === start && previous.reason === reason) {
            previous.end = end;
        } else {
            ranges.push({ start, end, reason });
        }
    });

    return ranges;
}

function getBlockedRanges(dateString, unavailableBlocks, excludedIds) {
    const weeklyRanges = getIncludedWeeklyEvents(
        dateString,
        excludedIds
    ).map((event) => ({
        start: event.start,
        end: event.end,
        type: "weekly",
        name: event.name,
        category: event.category
    }));

    const customRanges = mergeUnavailableBlocks(unavailableBlocks).map(
        (range) => ({
            ...range,
            type: "unavailable",
            name: range.reason || "Unavailable"
        })
    );

    return [...weeklyRanges, ...customRanges];
}

function getAvailableStudySlots(
    startTime,
    endTime,
    dateString,
    unavailableBlocks = {},
    excludedIds = []
) {
    const blockedRanges = getBlockedRanges(
        dateString,
        unavailableBlocks,
        excludedIds
    ).sort((a, b) => a.start.localeCompare(b.start));

    const slots = [];
    let current = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    blockedRanges.forEach((block) => {
        const blockStart = Math.max(
            timeToMinutes(block.start),
            timeToMinutes(startTime)
        );

        const blockEnd = Math.min(
            timeToMinutes(block.end),
            end
        );

        if (blockEnd <= current || blockStart >= end) {
            return;
        }

        if (blockStart > current) {
            slots.push({
                start: minutesToTime(current),
                end: minutesToTime(blockStart)
            });
        }

        current = Math.max(current, blockEnd);
    });

    if (current < end) {
        slots.push({
            start: minutesToTime(current),
            end: minutesToTime(end)
        });
    }

    return slots;
}

function getPrioritizedAssignments(dateString) {
    return assignments
        .filter((assignment) => assignment.progress < 100)
        .map((assignment) => {
            const daysLeft = getDaysBetween(dateString, assignment.due);

            const remainingHours =
                assignment.hours * (1 - assignment.progress / 100);

            const urgency = Math.max(daysLeft + 1, 1);

            return {
                ...assignment,
                remainingMinutes: Math.ceil(remainingHours * 60),
                priorityScore: remainingHours / urgency
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

    const tasks = prioritizedAssignments.map((task) => ({ ...task }));

    for (const slot of availableSlots) {
        let current = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end);

        if (slotEnd - current < 20) {
            continue;
        }

        for (const task of tasks) {
            while (task.remainingMinutes > 0 && current < slotEnd) {
                const available = slotEnd - current;

                if (available < 20) {
                    break;
                }

                const duration = Math.min(
                    studyDuration,
                    task.remainingMinutes,
                    available
                );

                if (duration < 20) {
                    break;
                }

                studyPlan.push({
                    id: createId(),
                    type: "study",
                    assignmentId: task.id,
                    name: task.name,
                    course: task.course,
                    start: minutesToTime(current),
                    end: minutesToTime(current + duration),
                    duration,
                    completed: false,
                    notes: ""
                });

                current += duration;
                task.remainingMinutes -= duration;

                const hasRemainingWork = tasks.some(
                    (item) => item.remainingMinutes > 0
                );

                if (
                    duration === studyDuration &&
                    hasRemainingWork &&
                    breakDuration > 0 &&
                    current + breakDuration + 20 <= slotEnd
                ) {
                    studyPlan.push({
                        id: createId(),
                        type: "break",
                        name: "Break ☕",
                        start: minutesToTime(current),
                        end: minutesToTime(current + breakDuration),
                        duration: breakDuration
                    });

                    current += breakDuration;
                }
            }

            if (slotEnd - current < 20) {
                break;
            }
        }
    }

    return studyPlan;
}

generatePlanBtn.addEventListener("click", () => {
    const dateString = studyDateInput.value;
    const startTime = studyStartInput.value;
    const endTime = studyEndInput.value;

    if (!dateString || !startTime || !endTime || endTime <= startTime) {
        alert("Please select a valid date and study time range.");
        return;
    }

    if (savedPlans[dateString]) {
        const replace = confirm(
            `A plan already exists for ${dateString}.\n` +
            "Replace it with a new plan?\n" +
            "Existing sessions, completion status, and notes will be reset."
        );

        if (!replace) {
            return;
        }
    }

    const availableSlots = getAvailableStudySlots(
        startTime,
        endTime,
        dateString,
        availabilityDraft,
        excludedWeeklyDraft
    );

    const prioritizedAssignments = getPrioritizedAssignments(dateString);

    if (availableSlots.length === 0) {
        planMessage.textContent = "No available study time for this date.";
        return;
    }

    if (prioritizedAssignments.length === 0) {
        planMessage.textContent = "No pending assignments to schedule.";
        return;
    }

    const sessions = generateStudyPlan(
        availableSlots,
        prioritizedAssignments
    );

    if (sessions.length === 0) {
        planMessage.textContent =
            "No study sessions could be generated. Try a longer time range.";
        return;
    }

    savedPlans[dateString] = {
        date: dateString,
        startTime,
        endTime,
        unavailableBlocks: { ...availabilityDraft },
        excludedWeeklyEvents: [...excludedWeeklyDraft],
        sessions,
        notes: ""
    };

    saveDailyPlans();

    planMessage.textContent = `Study plan saved for ${dateString}!`;

    openPlanDetail(dateString);
});

function getActivePlan() {
    return activePlanDate ? savedPlans[activePlanDate] : null;
}

function navigateToPage(pageId) {
    navItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.page === pageId);
    });

    pages.forEach((page) => {
        page.classList.toggle("active", page.id === pageId);
    });
}

function openPlanDetail(dateString) {
    if (!savedPlans[dateString]) {
        return;
    }

    activePlanDate = dateString;

    plannerHome.hidden = true;
    plannerDetail.hidden = false;

    closeStudySessionForm();
    displaySavedPlan();

    notesMessage.textContent = "";

    navigateToPage("planner");

    document.getElementById("planner").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showPlannerHome() {
    activePlanDate = null;

    plannerDetail.hidden = true;
    plannerHome.hidden = false;

    displaySavedPlansList();

    document.getElementById("planner").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

backToPlansBtn.addEventListener("click", () => {
    const plan = getActivePlan();

    if (plan && dailyNotesInput.value !== (plan.notes || "")) {
        if (!confirm("You have unsaved Daily Notes. Leave without saving?")) {
            return;
        }
    }

    showPlannerHome();
});

editPlanAvailabilityBtn.addEventListener("click", () => {
    const plan = getActivePlan();

    if (!plan) {
        return;
    }

    if (dailyNotesInput.value !== (plan.notes || "")) {
        if (!confirm("You have unsaved Daily Notes. Leave without saving?")) {
            return;
        }
    }

    const dateString = activePlanDate;

    showPlannerHome();

    studyDateInput.value = dateString;
    refreshAvailabilityEditor();
    openAvailabilityEditor();
});

function displayStudySummary(sessions) {
    const studySessions = getStudySessions(sessions);
    const breaks = sessions.filter((session) => session.type === "break");

    const studyMinutes = studySessions.reduce(
        (total, session) => total + session.duration,
        0
    );

    const breakMinutes = breaks.reduce(
        (total, session) => total + session.duration,
        0
    );

    const completed = studySessions.filter(
        (session) => session.completed
    ).length;

    const completion = getPlanCompletion(sessions);

    document.getElementById("total-study-time").textContent =
        `${(studyMinutes / 60).toFixed(1)} hours`;

    document.getElementById("study-session-count").textContent =
        studySessions.length;

    document.getElementById("total-break-time").textContent =
        `${breakMinutes} minutes`;

    document.getElementById("completed-session-count").textContent =
        `${completed} / ${studySessions.length}`;

    document.getElementById("daily-completion").textContent =
        `${completion}%`;

    document.getElementById("daily-completion-fill").style.width =
        `${completion}%`;

    document.getElementById("daily-completion-bar").setAttribute(
        "aria-valuenow",
        String(completion)
    );

    document.getElementById("study-summary").hidden = false;
}

function createDailyTimetableBlock({
    start,
    end,
    name,
    type,
    onClick
}) {
    const plan = getActivePlan();

    if (!plan) {
        return;
    }

    const planStart = timeToMinutes(plan.startTime);
    const planEnd = timeToMinutes(plan.endTime);

    const visibleStart = Math.max(timeToMinutes(start), planStart);
    const visibleEnd = Math.min(timeToMinutes(end), planEnd);

    if (visibleEnd <= visibleStart) {
        return;
    }

    const top = (visibleStart - planStart) / 60 * DAILY_HOUR_HEIGHT;
    const height = (visibleEnd - visibleStart) / 60 * DAILY_HOUR_HEIGHT;

    const block = document.createElement(
        onClick ? "button" : "div"
    );

    if (onClick) {
        block.type = "button";
        block.addEventListener("click", onClick);
    }

    block.className = `daily-timetable-block ${type}`;

    if (height < 40) {
        block.classList.add("compact");
    }

    block.style.top = `${top}px`;
    block.style.height = `${height}px`;

    const title = document.createElement("span");
    title.className = "daily-timetable-block-title";
    title.textContent = name;

    const time = document.createElement("span");
    time.className = "daily-timetable-block-time";
    time.textContent = `${start} - ${end}`;

    block.appendChild(title);
    block.appendChild(time);

    block.title = `${name}\n${start} - ${end}`;

    dailyTimetableEvents.appendChild(block);
}

function displayDailyTimetable() {
    dailyTimetableTimeColumn.innerHTML = "";
    dailyTimetableEvents.innerHTML = "";

    const plan = getActivePlan();

    if (!plan) {
        return;
    }

    const start = timeToMinutes(plan.startTime);
    const end = timeToMinutes(plan.endTime);
    const totalHeight = (end - start) / 60 * DAILY_HOUR_HEIGHT;

    dailyTimetableTimeColumn.style.height = `${totalHeight}px`;
    dailyTimetableEvents.style.height = `${totalHeight}px`;

    const firstHour = Math.ceil(start / 60);
    const lastHour = Math.floor(end / 60);

    for (let hour = firstHour; hour <= lastHour; hour++) {
        const label = document.createElement("div");
        label.className = "daily-time-label";

        const displayHour = hour % 12 || 12;
        const period = hour < 12 ? "AM" : "PM";

        label.textContent = `${displayHour} ${period}`;
        label.style.top =
            `${(hour * 60 - start) / 60 * DAILY_HOUR_HEIGHT}px`;

        dailyTimetableTimeColumn.appendChild(label);
    }

    const blockedRanges = getBlockedRanges(
        activePlanDate,
        plan.unavailableBlocks || {},
        plan.excludedWeeklyEvents || []
    );

    blockedRanges.forEach((block) => {
        createDailyTimetableBlock({
            start: block.start,
            end: block.end,
            name: block.name,
            type: block.type
        });
    });

    plan.sessions.forEach((session) => {
        createDailyTimetableBlock({
            start: session.start,
            end: session.end,
            name: session.name,
            type: session.type,
            onClick: session.type === "study"
                ? () => openEditStudySessionForm(session.id)
                : null
        });
    });
}

function displaySavedPlan() {
    const plan = getActivePlan();

    if (!plan || !Array.isArray(plan.sessions)) {
        return;
    }

    document.getElementById("study-plan-heading").textContent =
        `Study Plan — ${activePlanDate}`;

    planList.innerHTML = "";

    dailyNotesInput.value = plan.notes || "";

    const sortedSessions = [...plan.sessions].sort(
        (a, b) => a.start.localeCompare(b.start)
    );

    sortedSessions.forEach((session) => {
        const item = document.createElement("div");
        item.className = "event-item";

        if (session.type === "break") {
            item.classList.add("break-session");

            const title = document.createElement("strong");
            title.textContent = session.name;

            const details = document.createElement("p");
            details.textContent =
                `${session.start} - ${session.end} | ${session.duration} min`;

            item.appendChild(title);
            item.appendChild(details);
            planList.appendChild(item);
            return;
        }

        item.classList.add("study-session");

        if (session.completed) {
            item.classList.add("completed");
        }

        const title = document.createElement("strong");
        title.className = "session-title";
        title.textContent = session.name;

        const details = document.createElement("p");
        details.textContent =
            `${session.start} - ${session.end} | ${session.course} | ${session.duration} min`;

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "progress-btn";
        editBtn.textContent = "Edit Session";

        editBtn.addEventListener("click", () => {
            openEditStudySessionForm(session.id);
        });

        item.appendChild(title);
        item.appendChild(details);
        item.appendChild(editBtn);

        const checkboxLabel = document.createElement("label");
        checkboxLabel.className = "session-check";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(session.completed);

        const checkboxText = document.createElement("span");
        checkboxText.textContent = "Study session completed";

        checkbox.addEventListener("change", () => {
            session.completed = checkbox.checked;

            item.classList.toggle("completed", session.completed);

            saveDailyPlans();
            displayStudySummary(plan.sessions);
        });

        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(checkboxText);
        item.appendChild(checkboxLabel);

        const assignment = assignments.find(
            (task) => task.id === session.assignmentId
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
            const missing = document.createElement("p");
            missing.className = "session-progress-note";
            missing.textContent =
                "This assignment was deleted. Its study record is preserved.";

            progressSection.appendChild(missing);
        }

        item.appendChild(progressSection);

        const notesSection = document.createElement("div");
        notesSection.className = "session-notes";

        const notesLabel = document.createElement("label");
        notesLabel.textContent = "Session Notes";

        const notesInput = document.createElement("textarea");
        notesInput.className = "notes-input";
        notesInput.rows = 3;
        notesInput.placeholder =
            "Add tasks, goals, or reminders for this session...";
        notesInput.value = session.notes || "";

        notesInput.addEventListener("input", () => {
            session.notes = notesInput.value;
            saveDailyPlans();
        });

        notesSection.appendChild(notesLabel);
        notesSection.appendChild(notesInput);

        item.appendChild(notesSection);
        planList.appendChild(item);
    });

    if (plan.sessions.length === 0) {
        planList.textContent = "No study sessions found.";
    }

    displayStudySummary(plan.sessions);
    displayDailyTimetable();
}

function populateSessionAssignments(selectedId = "") {
    sessionAssignmentInput.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select an assignment";
    sessionAssignmentInput.appendChild(placeholder);

    assignments.forEach((assignment) => {
        const option = document.createElement("option");
        option.value = assignment.id;
        option.textContent = `${assignment.course} — ${assignment.name}`;

        sessionAssignmentInput.appendChild(option);
    });

    if (selectedId && !assignments.some(
        (assignment) => assignment.id === selectedId
    )) {
        const plan = getActivePlan();
        const session = plan?.sessions.find(
            (item) => item.id === editingSessionId
        );

        const option = document.createElement("option");
        option.value = selectedId;
        option.textContent = `${session?.name || "Deleted assignment"} (deleted)`;

        sessionAssignmentInput.appendChild(option);
    }

    sessionAssignmentInput.value = selectedId;
}

function closeStudySessionForm() {
    studySessionForm.hidden = true;
    studySessionForm.reset();

    editingSessionId = null;
    studySessionMessage.textContent = "";
    deleteStudySessionBtn.hidden = true;
}

function openAddStudySessionForm() {
    const plan = getActivePlan();

    if (!plan) {
        return;
    }

    editingSessionId = null;

    populateSessionAssignments();

    studySessionFormTitle.textContent = "Add Study Session";
    saveStudySessionBtn.textContent = "Save Session";
    deleteStudySessionBtn.hidden = true;

    sessionStartInput.value = plan.startTime;
    sessionEndInput.value = "";

    studySessionForm.hidden = false;

    studySessionForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function openEditStudySessionForm(sessionId) {
    const plan = getActivePlan();
    const session = plan?.sessions.find(
        (item) => item.id === sessionId
    );

    if (!session || session.type !== "study") {
        return;
    }

    editingSessionId = session.id;

    populateSessionAssignments(session.assignmentId);

    sessionStartInput.value = session.start;
    sessionEndInput.value = session.end;

    studySessionFormTitle.textContent = "Edit Study Session";
    saveStudySessionBtn.textContent = "Save Changes";
    deleteStudySessionBtn.hidden = false;

    studySessionForm.hidden = false;

    studySessionForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

addStudySessionBtn.addEventListener("click", openAddStudySessionForm);
cancelStudySessionBtn.addEventListener("click", closeStudySessionForm);
closeStudySessionFormBtn.addEventListener("click", closeStudySessionForm);

function hasSessionConflict(start, end, excludedSessionId = null) {
    const plan = getActivePlan();

    if (!plan) {
        return true;
    }

    const blocked = getBlockedRanges(
        activePlanDate,
        plan.unavailableBlocks || {},
        plan.excludedWeeklyEvents || []
    );

    const blockedConflict = blocked.some(
        (range) => start < range.end && end > range.start
    );

    const sessionConflict = plan.sessions.some((session) => {
        return (
            session.id !== excludedSessionId &&
            start < session.end &&
            end > session.start
        );
    });

    return blockedConflict || sessionConflict;
}

studySessionForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const plan = getActivePlan();

    if (!plan) {
        return;
    }

    const assignmentId = sessionAssignmentInput.value;
    const start = sessionStartInput.value;
    const end = sessionEndInput.value;

    if (!assignmentId || !start || !end || end <= start) {
        studySessionMessage.textContent =
            "Please enter valid session information.";
        return;
    }

    if (start < plan.startTime || end > plan.endTime) {
        studySessionMessage.textContent =
            "The session must be within the plan's time range.";
        return;
    }

    if (hasSessionConflict(start, end, editingSessionId)) {
        studySessionMessage.textContent =
            "This session overlaps with another session or unavailable time.";
        return;
    }

    const assignment = assignments.find(
        (item) => item.id === assignmentId
    );

    const existingSession = editingSessionId
        ? plan.sessions.find((item) => item.id === editingSessionId)
        : null;

    if (!assignment && !existingSession) {
        studySessionMessage.textContent =
            "Please select an existing assignment.";
        return;
    }

    const duration = timeToMinutes(end) - timeToMinutes(start);

    if (existingSession) {
        existingSession.assignmentId = assignmentId;
        existingSession.name = assignment?.name || existingSession.name;
        existingSession.course = assignment?.course || existingSession.course;
        existingSession.start = start;
        existingSession.end = end;
        existingSession.duration = duration;
    } else {
        plan.sessions.push({
            id: createId(),
            type: "study",
            assignmentId,
            name: assignment.name,
            course: assignment.course,
            start,
            end,
            duration,
            completed: false,
            notes: ""
        });
    }

    saveDailyPlans();
    closeStudySessionForm();
    displaySavedPlan();
});

deleteStudySessionBtn.addEventListener("click", () => {
    const plan = getActivePlan();

    if (!plan || !editingSessionId) {
        return;
    }

    if (!confirm("Delete this study session?")) {
        return;
    }

    plan.sessions = plan.sessions.filter(
        (session) => session.id !== editingSessionId
    );

    saveDailyPlans();
    closeStudySessionForm();
    displaySavedPlan();
});

function displaySavedPlansList() {
    const list = document.getElementById("saved-plans-list");
    list.innerHTML = "";

    const dates = Object.keys(savedPlans)
        .filter((date) => Array.isArray(savedPlans[date]?.sessions))
        .sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) {
        list.textContent = "No saved plans yet.";
        return;
    }

    dates.forEach((date) => {
        const plan = savedPlans[date];
        const sessions = getStudySessions(plan.sessions);
        const completed = sessions.filter(
            (session) => session.completed
        ).length;

        const item = document.createElement("div");
        item.className = "saved-plan-item";

        const info = document.createElement("div");
        info.className = "saved-plan-info";

        const title = document.createElement("strong");
        title.textContent = date;

        const completion = document.createElement("p");
        completion.textContent =
            `${getPlanCompletion(plan.sessions)}% completed ` +
            `(${completed}/${sessions.length} sessions)`;

        const notePreview = document.createElement("p");
        notePreview.className = "saved-plan-note";

        const notes = (plan.notes || "").trim();

        notePreview.textContent = notes
            ? `📝 ${notes.length > 100 ? notes.slice(0, 100) + "..." : notes}`
            : "📝 No notes yet";

        info.appendChild(title);
        info.appendChild(completion);
        info.appendChild(notePreview);

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "progress-btn";
        viewBtn.textContent = "View Plan";

        viewBtn.addEventListener("click", () => {
            openPlanDetail(date);
        });

        item.appendChild(info);
        item.appendChild(viewBtn);

        list.appendChild(item);
    });
}

saveDailyNotesBtn.addEventListener("click", () => {
    const plan = getActivePlan();

    if (!plan) {
        notesMessage.textContent = "No saved plan found.";
        return;
    }

    plan.notes = dailyNotesInput.value;

    saveDailyPlans();

    notesMessage.textContent = "Notes saved successfully!";
});

function displayDashboardStudyPlan() {
    const today = getLocalDateString();
    const plan = savedPlans[today];

    dashboardStudyDate.textContent = today;

    const hasPlan = Boolean(plan && Array.isArray(plan.sessions));

    dashboardNoPlan.hidden = hasPlan;
    dashboardExistingPlan.hidden = !hasPlan;
    dashboardViewPlanBtn.hidden = !hasPlan;

    if (!hasPlan) {
        dashboardStudySessions.innerHTML = "";
        return;
    }

    const completion = getPlanCompletion(plan.sessions);

    dashboardDailyProgress.textContent = `${completion}%`;
    dashboardDailyProgressFill.style.width = `${completion}%`;

    dashboardDailyProgressBar.setAttribute(
        "aria-valuenow",
        String(completion)
    );

    dashboardStudySessions.innerHTML = "";

    const sortedSessions = [...plan.sessions].sort(
        (a, b) => a.start.localeCompare(b.start)
    );

    sortedSessions.forEach((session) => {
        const item = document.createElement("div");
        item.className = "dashboard-study-session";

        if (session.type === "break") {
            item.classList.add("break");
        } else if (session.completed) {
            item.classList.add("completed");
        }

        const info = document.createElement("div");
        info.className = "dashboard-study-session-info";

        const title = document.createElement("strong");
        title.textContent = session.name;

        const details = document.createElement("p");
        details.textContent = `${session.start} - ${session.end}`;

        info.appendChild(title);
        info.appendChild(details);

        const status = document.createElement("span");
        status.className = "dashboard-study-status";

        if (session.type === "break") {
            status.textContent = "Break";
        } else {
            status.textContent = session.completed
                ? "✓ Completed"
                : "Pending";
        }

        item.appendChild(info);
        item.appendChild(status);

        dashboardStudySessions.appendChild(item);
    });

    if (sortedSessions.length === 0) {
        dashboardStudySessions.textContent =
            "No study sessions in today's plan.";
    }
}

dashboardViewPlanBtn.addEventListener("click", () => {
    openPlanDetail(getLocalDateString());
});

dashboardCreatePlanBtn.addEventListener("click", () => {
    navigateToPage("planner");
    showPlannerHome();

    studyDateInput.value = getLocalDateString();
    refreshAvailabilityEditor();
});

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

displayEvents();
displayAssignments();
refreshAvailabilityEditor();
displaySavedPlansList();
displayDashboardStudyPlan();

plannerDetail.hidden = true;
plannerHome.hidden = false;