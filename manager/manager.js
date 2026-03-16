import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const answersContainer = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;

// Optional: add a back button handler
backBtn.onclick = () => {
    window.location.href = "../index.html"; // change to your home
};

// Load i18n strings
async function init() {
    strings = await loadLocale("manager"); // create a `manager.json` in locales

    if (!passcode) {
        showUnauthorized();
        return;
    }

    try {
        const snapshot = await get(ref(db));
        if (!snapshot.exists()) {
            showUnauthorized();
            return;
        }

        const data = snapshot.val();

        // Find the object where real-name === "Martina"
        let matchedCode = null;
        for (const [code, obj] of Object.entries(data)) {
            if (obj["real-name"] === "Martina") {
                matchedCode = code;
                break;
            }
        }

        if (matchedCode && matchedCode === passcode) {
            showManagerContent();
        } else {
            showUnauthorized();
        }

    } catch (err) {
        console.error("Firebase error:", err);
        showUnauthorized();
    }
}

// Show manager content inside terminal
function showManagerContent() {
    terminal.innerHTML = `
        <strong>${strings.welcome}</strong><br><br>
        ${strings.managerInstructions}
    `;

    // Example of a button in answersContainer
    answersContainer.innerHTML = `
        <div class="userRow">
            <button onclick="alert('Do something!')">${strings.doSomething}</button>
        </div>
    `;
}

// Show UNAUTHORIZED in same style
function showUnauthorized() {
    terminal.innerHTML = `<div class="intruder-screen">
        <div class="warning">UNAUTHORIZED</div>
    </div>`;
}

init();
