import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode");

async function init() {
    const strings = await loadLocale("report");

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;

    // --- Explanation ---
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    // --- Rules ---
    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem"; // smaller than body
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";

    // --- User Field Label ---
    const userLabel = document.createElement("div");
    userLabel.textContent = strings.userField;
    userLabel.style.fontSize = "1.1rem";
    userLabel.style.marginTop = "1rem";
    userLabel.style.marginBottom = "0.3rem";
    rulesDiv.appendChild(userLabel);

    // --- Dropdown ---
    const select = document.createElement("select");
    select.id = "reportDropdown"; // optional ID for CSS styling

    // Fetch available entries from Firebase
    const snapshot = await get(ref(db, `${passcode}/entries/names`));
    const names = snapshot.exists() ? snapshot.val() : [];

    if (names.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No entries available";
        option.disabled = true;
        select.appendChild(option);
    } else {
        names.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    rulesDiv.appendChild(select);
}

init();
