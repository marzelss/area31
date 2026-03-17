import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const reportsList = document.getElementById("reportsList");
const emptyState = document.getElementById("emptyState");
const backButton = document.getElementById("backButton");

let passcode = sessionStorage.getItem("passcode");
let lang = sessionStorage.getItem("lang") || "en";

// --- Load locale strings ---
const strings = await loadLocale("reportHistory");

async function init() {

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">${strings.title}</strong>`;

    if (!passcode) {
        showUnauthorized();
        return;
    }

    const snapshot = await get(ref(db, `${passcode}/reports`));

    if (!snapshot.exists()) {
        emptyState.textContent = "—";
        return;
    }

    const reports = snapshot.val();

    await renderReportsAnimated(Object.values(reports));

    // --- Message above back button ---
    const message = document.createElement("div");
    message.textContent = strings.message;
    message.style.marginTop = "1.5rem";

    document.body.insertBefore(message, backButton);

    // --- Back button ---
    backButton.textContent = strings.backButton;
    backButton.style.cursor = "pointer";
    backButton.style.textDecoration = "underline";

    backButton.onclick = () => {
        window.history.back();
    };
}

async function renderReportsAnimated(reports) {

    for (const report of reports) {

        const line = document.createElement("div");

        const roleText = report.role[lang] || report.role.en;

        line.textContent = `[✓] ${report.name} → ${roleText}`;
        line.style.marginBottom = "0.5rem";

        reportsList.appendChild(line);

        await delay(120);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showUnauthorized() {

    terminal.innerHTML = `<strong style="font-size: 2rem; color: red;">UNAUTHORIZED</strong>`;
    reportsList.textContent = "";
    emptyState.textContent = "";
}

init();
