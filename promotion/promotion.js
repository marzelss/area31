import { loadLocale } from "../utils/i18n.js";
import { infoLogEvent, errorLogEvent, dbLogEvent } from "../utils/analytics.js";

const terminal = document.getElementById("terminal");
const applyBtn = document.getElementById("applyBtn");
const backBtn = document.getElementById("backBtn");

const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;

// Protect page: redirect if sessionStorage missing required keys
(function checkSession() {
    const realName = sessionStorage.getItem("realName");
    const passcode = sessionStorage.getItem("passcode");

    if (!realName || !passcode) {
        // Clear session storage just in case
        sessionStorage.clear();

        // Redirect to index.html and replace history so back button won't work
        location.replace("../index.html");
    }
})();

function formatLine(lineObj) {

    if (!lineObj.text) return "";

    if (lineObj.bold) {
        return `<strong>${lineObj.text}</strong>`;
    }

    return lineObj.text;

}

function renderInstant(lines) {

    const formatted = lines
        .map(l => formatLine(l))
        .join("\n");

    terminal.innerHTML = formatted;

    applyBtn.style.display = "inline-block";
    backBtn.style.display = "inline-block";
}

async function init() {
    infoLogEvent("User selected button: APPLY FOR PROMOTION");
    strings = await loadLocale("promotion");

    applyBtn.textContent = strings.applyButton;
    backBtn.textContent = strings.backButton;

    backBtn.onclick = () => {
        window.location.href = "../protocol/protocol.html";
    };

    applyBtn.onclick = () => {
        infoLogEvent("User selected button: APPLY FOR PROMOTION: APPLY");
        window.location.href = "../interview/interview.html";
    };

    const lines = [

        { text: strings.header, bold: true },
        { text: strings.posted },
        { text: "" },

        { text: strings.title, bold: true },
        { text: "" },

        { text: strings.expTitle, bold: true },
        { text: strings.exp1 },
        { text: strings.exp2 },
        { text: strings.exp3 },
        { text: "" },

        { text: strings.tasksTitle, bold: true },
        { text: strings.task1 },
        { text: strings.task2 },
        { text: strings.task3 },
        { text: "" },

        { text: strings.pay, bold: true }

    ];

    renderInstant(lines);

}

init();
