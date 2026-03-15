import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");

const typingSpeed = 15;
const linePause = 500;

const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;

function formatLine(lineObj) {

    if (!lineObj.text) return "";

    if (lineObj.bold) {
        return `<strong>${lineObj.text}</strong>`;
    }

    return lineObj.text;

}

function typeLines(lines) {

    let currentLine = 0;
    let currentChar = 0;

    function type() {

        if (currentLine >= lines.length) {
            terminal.innerHTML += "\n";
            return;
        }

        const lineObj = lines[currentLine];
        const line = lineObj.text || "";

        const visibleText = line.substring(0, currentChar);
        const formatted = lineObj.bold
            ? `<strong>${visibleText}</strong>`
            : visibleText;

        const previousLines = lines
            .slice(0, currentLine)
            .map(l => formatLine(l))
            .join("\n");

        terminal.innerHTML = previousLines + "\n" + formatted;

        terminal.scrollTop = terminal.scrollHeight;

        if (currentChar < line.length) {

            currentChar++;
            setTimeout(type, typingSpeed);

        } else {

            currentLine++;
            currentChar = 0;
            setTimeout(type, linePause);

        }

    }

    type();
}

async function init() {

    strings = await loadLocale("promotion");

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

    typeLines(lines);

}

init();
