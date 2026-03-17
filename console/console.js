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
        btn.addEventListener("click", () => showGuestPopup(guest, key));
        guestListDiv.appendChild(btn);
    });
}

// Show scrollable popup for a guest
function showGuestPopup(guest, guestKey) {
    // Create popup container
    const popup = document.createElement("div");
    popup.className = "popup";

    // Content container
    const content = document.createElement("div");
    content.className = "popup-content";

    const userLang = navigator.language.startsWith("it") ? "it" : "en";
    const role = guest.role?.[userLang];

    // Add basic info
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

    // --- Status / analytics strings ---
    const statusList = document.createElement("ul");
    statusList.style.paddingLeft = "1.2rem"; // indent bullets

    // Conditions
    if (guest.status === "DELIVERED") {
        const li = document.createElement("li");
        li.textContent = "📨 MESSAGE DELIVERED";
        statusList.appendChild(li);
    }
    if (guest.status === "UNLOCKED") {
        const li = document.createElement("li");
        li.textContent = "🗺️ LOCATION REVEALED";
        statusList.appendChild(li);
    }
    if (guest.interpreter?.eligible === true) {
        const li = document.createElement("li");
        li.textContent = "📝 SENT INTERPRETER APPLICATION";
        statusList.appendChild(li);
    }
    if (guest.interpreter?.client != null) {
        const li = document.createElement("li");
        li.textContent = "👩🏻‍✈️ IS INTERPRETER";
        statusList.appendChild(li);
    }
    if (guest.service?.interpreter != null) {
        const li = document.createElement("li");
        li.textContent = "🛎️ SERVICE REQUESTED";
        statusList.appendChild(li);
    }
    if (guest.arrived === "TRUE") {
        const li = document.createElement("li");
        li.textContent = "📍 USER ARRIVED";
        statusList.appendChild(li);
    }
    if (guest.reports && Object.keys(guest.reports).length > 0) {
        const li = document.createElement("li");
        li.textContent = "💬 USER HAS FILED REPORTS";
        statusList.appendChild(li);
    }

    // --- NEW: Add hasExposed / wasExposed / points ---
    (async () => {
        try {
            const [hasExposedSnap, wasExposedSnap, pointsSnap] = await Promise.all([
                get(ref(db, `${guestKey}/hasExposed`)),
                get(ref(db, `${guestKey}/wasExposed`)),
                get(ref(db, `${guestKey}/points`))
            ]);
    
            const hasExposed = hasExposedSnap.exists() ? hasExposedSnap.val() : 0;
            const wasExposed = wasExposedSnap.exists() ? wasExposedSnap.val() : 0;
            const points = pointsSnap.exists() ? pointsSnap.val() : 0;
    
            const li1 = document.createElement("li");
            li1.textContent = `👀 HAS EXPOSED: ${hasExposed}`;
            statusList.appendChild(li1);
    
            const li2 = document.createElement("li");
            li2.textContent = `🕶️ WAS EXPOSED BY: ${wasExposed}`;
            statusList.appendChild(li2);
    
            const li3 = document.createElement("li");
            li3.textContent = `💯 POINTS: ${points}`;
            statusList.appendChild(li3);
        } catch (err) {
            console.error("Failed to load extra stats:", err);
        }
    })();

    content.appendChild(statusList);

    // Two line breaks
    content.appendChild(document.createElement("br"));
    content.appendChild(document.createElement("br"));

    // Fetch analytics messages
    (async () => {
        try {
            const snapshot = await get(ref(db, `${guestKey}/analytics`));
            if (snapshot.exists()) {
                const analytics = snapshot.val();
                Object.values(analytics).forEach(a => {
                    if (a.message) {
                        const p = document.createElement("p");
                        p.textContent = a.message;
                        content.appendChild(p);
                    }
                });
            }
        } catch (err) {
            console.error("Failed to load analytics:", err);
        }
    })();

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
