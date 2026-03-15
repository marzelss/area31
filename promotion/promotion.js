import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const applyBtn = document.getElementById("applyBtn");
const backBtn = document.getElementById("backBtn");

const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;

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

    strings = await loadLocale("promotion");

    applyBtn.textContent = strings.applyButton;
    backBtn.textContent = strings.backButton;

    backBtn.onclick = () => {
        window.location.href = "../protocol/protocol.html";
    };

    applyBtn.onclick = () => {
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
