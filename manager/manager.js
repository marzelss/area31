import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode");

async function init() {

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

        // Find object where real-name === "Martina"
        let matchedCode = null;
        for (const [code, obj] of Object.entries(data)) {
            if (obj["real-name"] === "Martina") {
                matchedCode = code;
                break;
            }
        }

        // Compare with sessionStorage passcode
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

// --- Show manager content ---
function showManagerContent() {
    // Content...
}

// --- Show UNAUTHORIZED ---
function showUnauthorized() {
    explanationDiv.textContent = "";
    rulesDiv.textContent = "";
    terminal.innerHTML = `<strong style="font-size: 2rem; color: red;">UNAUTHORIZED</strong>`;
}

init();
