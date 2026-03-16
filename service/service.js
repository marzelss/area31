import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const usersList = document.getElementById("usersList");

// get all users from Firebase
async function loadEligibleUsers() {
    const snapshot = await get(ref(db));
    if (!snapshot.exists()) {
        usersList.innerHTML = "No users found.";
        return;
    }

    const data = snapshot.val();

    // Filter users who have interpreter/eligible === true
    const eligibleUsers = Object.entries(data)
        .filter(([passcode, user]) => user.interpreter?.eligible === true);

    if (eligibleUsers.length === 0) {
        usersList.innerHTML = "No eligible interpreter applications.";
        return;
    }

    // Create UI
    eligibleUsers.forEach(([passcode, user]) => {

        const container = document.createElement("div");
        container.className = "userRow";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.marginBottom = "1rem";

        const nameDiv = document.createElement("div");
        nameDiv.textContent = user["real-name"] || "UNKNOWN";
        nameDiv.style.flex = "1";
        container.appendChild(nameDiv);

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "ACCEPT";
        acceptBtn.style.marginRight = "0.5rem";
        acceptBtn.onclick = async () => {
            await update(ref(db, `${passcode}/interpreter`), { serviceStatus: "accepted" });
            container.remove();
        };

        const refuseBtn = document.createElement("button");
        refuseBtn.textContent = "REFUSE";
        refuseBtn.onclick = async () => {
            await update(ref(db, `${passcode}/interpreter`), { serviceStatus: "refused" });
            container.remove();
        };

        container.appendChild(acceptBtn);
        container.appendChild(refuseBtn);

        usersList.appendChild(container);

    });
}

loadEligibleUsers();
