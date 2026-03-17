import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const guestListDiv = document.getElementById("guestList");

// Fetch all guests from database
async function loadGuests() {
    const snapshot = await get(ref(db, '/'));
    if (!snapshot.exists()) {
        guestListDiv.textContent = "No guests found.";
        return;
    }
    const guests = snapshot.val();

    Object.keys(guests).forEach(key => {
        const guest = guests[key];
        const btn = document.createElement("button");
        btn.className = "guest-btn";
        btn.textContent = guest["real-name"] || `Guest ${key}`;
        btn.addEventListener("click", () => showGuestPopup(guest));
        guestListDiv.appendChild(btn);
    });
}

// Show scrollable popup for a guest
function showGuestPopup(guest) {
    // Create popup container
    const popup = document.createElement("div");
    popup.className = "popup";

    // Content container
    const content = document.createElement("div");
    content.className = "popup-content";

    const userLang = navigator.language.startsWith("it") ? "it" : "en";
    const role = guest.role?.[userLang];

    // Add info
    const nameEl = document.createElement("h2");
    nameEl.textContent = guest["real-name"];
    content.appendChild(nameEl);

    if (role) {
        const roleNameEl = document.createElement("p");
        roleNameEl.innerHTML = `<strong>Role:</strong> ${role.name}`;
        content.appendChild(roleNameEl);

        const taskEl = document.createElement("p");
        taskEl.innerHTML = `<strong>Task:</strong> ${role.task}`;
        content.appendChild(taskEl);
    } else {
        const info = document.createElement("p");
        info.textContent = "No role assigned.";
        content.appendChild(info);
    }

    // Footer with OK button
    const footer = document.createElement("div");
    footer.className = "popup-footer";
    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", () => {
        document.body.removeChild(popup);
    });
    footer.appendChild(okBtn);

    popup.appendChild(content);
    popup.appendChild(footer);
    document.body.appendChild(popup);
}

loadGuests();
