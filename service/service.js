import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const usersList = document.getElementById("usersList");
const infoText = document.getElementById("infoText");
const terminal = document.getElementById("terminal");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

// Show the instructions text
infoText.textContent = 
  "As a guest with linguistic limitations, you can pick up to 3 interpreters who will follow you around for the entire duration of the event. For each interpreter you earn 2 points.\nAfter the event, you can rate the interpreter a good service and let them earn 3 extra points.";

async function loadEligibleUsers() {
    const snapshot = await get(ref(db));
    if (!snapshot.exists()) {
        usersList.innerHTML = "No users found.";
        return;
    }

    const data = snapshot.val();

    // Filter only users who are eligible interpreters
    const eligibleUsers = Object.entries(data)
        .filter(([interpreterPasscode, user]) => user.interpreter?.eligible === true);

    if (eligibleUsers.length === 0) {
        usersList.innerHTML = "No eligible interpreter applications.";
        return;
    }

    eligibleUsers.forEach(([interpreterPasscode, user]) => {
        const container = document.createElement("div");
        container.className = "userRow";
        container.style.marginBottom = "2rem";

        // Name displayed prominently
        const nameDiv = document.createElement("div");
        nameDiv.textContent = user["real-name"] || "UNKNOWN";
        nameDiv.style.fontSize = "1.5rem"; // bigger font
        nameDiv.style.fontWeight = "bold";
        container.appendChild(nameDiv);

        // Buttons container (under the name)
        const buttonsDiv = document.createElement("div");
        buttonsDiv.style.display = "flex";
        buttonsDiv.style.gap = "1rem";
        buttonsDiv.style.marginTop = "0.5rem";

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "ACCEPT";
        acceptBtn.onclick = async () => {
            // Save to guest's service
            await update(ref(db, `${passcode}/service/interpreter`), {
                [interpreterPasscode]: { name: user["real-name"], passcode: interpreterPasscode }
            });

            // Save to interpreter's client
            const guestSnapshot = await get(ref(db, passcode));
            const guestName = guestSnapshot.val()?.["real-name"] || "UNKNOWN";

            await update(ref(db, `${interpreterPasscode}/interpreter/client`), {
                [passcode]: { name: guestName, passcode: passcode }
            });

            container.remove();
        };

        const refuseBtn = document.createElement("button");
        refuseBtn.textContent = "REFUSE";
        refuseBtn.onclick = async () => {
            // Save to guest's refused list
            await update(ref(db, `${passcode}/service/refused`), {
                [interpreterPasscode]: { name: user["real-name"], passcode: interpreterPasscode }
            });

            container.remove();
        };

        buttonsDiv.appendChild(acceptBtn);
        buttonsDiv.appendChild(refuseBtn);

        container.appendChild(buttonsDiv);

        usersList.appendChild(container);
    });
}

loadEligibleUsers();
