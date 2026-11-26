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