import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode");

async function init() {

    // --- Firebase check ---
    if (!passcode) {
        showUnauthorized(strings);
        return;
    }

    try {
        const snapshot = await get(ref(db));
        if (!snapshot.exists()) {
            showUnauthorized(strings);
            return;
        }

        const data = snapshot.val();

        // find object where real-name === "Martina"
        let matchedCode = null;
        for (const [code, obj] of Object.entries(data)) {
            if (obj["real-name"] === "Martina") {
                matchedCode = code;
                break;
            }
        }

        // compare with sessionStorage passcode
        if (matchedCode && matchedCode === passcode) {
            showManagerContent(strings);
        } else {
            showUnauthorized(strings);
        }

    } catch (err) {
        console.error("Firebase error:", err);
        showUnauthorized(strings);
    }

    
    const strings = await loadLocale("manager"); // create manager.json in locales

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">${strings.title}</strong>`;

    // --- Explanation / Rules ---
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";
}

// --- Show manager content ---
function showManagerContent(strings) {
    explanationDiv.textContent = strings.managerInstructions;

    // Example: a button inside rulesDiv
    const button = document.createElement("button");
    button.textContent = strings.doSomething;
    button.onclick = () => alert("You did something!");
    rulesDiv.appendChild(button);
}

// --- Show UNAUTHORIZED ---
function showUnauthorized(strings) {
    explanationDiv.textContent = "";
    rulesDiv.textContent = "";
    terminal.innerHTML = `<strong style="font-size: 2rem; color: red;">${strings.unauthorized}</strong>`;
}

init();
