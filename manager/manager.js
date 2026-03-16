import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

let passcode = sessionStorage.getItem("passcode");

async function init() {

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">GAME MANAGER</strong>`;

    explanationDiv.textContent = "Restricted access terminal.";
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";

    // --- Ask for passcode if missing ---
    if (!passcode) {

        passcode = prompt("Enter passcode:");

        if (!passcode) {
            showUnauthorized();
            return;
        }

        sessionStorage.setItem("passcode", passcode);
    }

    await verifyUser(passcode);
}

async function verifyUser(passcode) {

    try {

        const snapshot = await get(ref(db, `${passcode}/real-name`));

        if (!snapshot.exists()) {
            showUnauthorized();
            return;
        }

        const realName = snapshot.val();

        // Save in session storage
        sessionStorage.setItem("realName", realName);
        sessionStorage.setItem("passcode", passcode);

        // Check authorization
        if (realName === "Martina") {
            showManagerContent(realName);
        } else {
            showUnauthorized();
        }

    } catch (err) {

        console.error("Firebase error:", err);
        showUnauthorized();

    }

}

function showManagerContent() {

    explanationDiv.textContent = "Welcome Martina. Game control panel unlocked.";

    const button = document.createElement("button");
    button.textContent = "Guests List";

    button.onclick = () => {
        window.location.href = "../manager/guests/guests.html";
    };

    rulesDiv.appendChild(button);

}

function showUnauthorized() {

    explanationDiv.textContent = "";
    rulesDiv.textContent = "";

    terminal.innerHTML = `<strong style="font-size: 2rem; color: red;">UNAUTHORIZED</strong>`;

}

init();
