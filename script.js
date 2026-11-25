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

    const eventItem = document.createElement("div");
    eventItem.className = "event-item";

    const eventTitle = document.createElement("strong");
    eventTitle.textContent = name;

    const eventDetails = document.createElement("p");
    eventDetails.textContent = `${day} | ${start} - ${end} | ${category}`;

    eventItem.appendChild(eventTitle);
    eventItem.appendChild(eventDetails);

    if (eventList.querySelector("p")?.textContent === "No recurring events added yet.") {
        eventList.innerHTML = "";
    }

    eventList.appendChild(eventItem);

    eventForm.reset();
    eventForm.hidden = true;
});