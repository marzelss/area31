import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const reportBtn = document.getElementById("reportBtn");

const typingSpeed = 15;
const linePause = 500;

const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;
const passcode = sessionStorage.getItem("passcode");

if (!passcode) {
    window.location.href = "../index.html";
}

async function getUser() {

    const snapshot = await get(ref(db, passcode));

    if (!snapshot.exists()) {
        window.location.href = "../index.html";
        return;
    }

    return snapshot.val();
}

function formatLine(lineObj) {

    if (!lineObj.text) return "";

    if (lineObj.bold) {
        return `<strong>${lineObj.text}</strong>`;
    }

    return lineObj.text;
}

function renderInstant(lines) {

    const formatted = lines.map(l => formatLine(l)).join("\n");

    terminal.innerHTML = formatted;
    reportBtn.style.display = "inline-block";

}

function typeLines(lines) {

    let currentLine = 0;
    let currentChar = 0;

    function type() {

        if (currentLine >= lines.length) {

            terminal.innerHTML += "\n";
            reportBtn.style.display = "inline-block";

            // mark as delivered in firebase
            update(ref(db, passcode), {
                status: "DELIVERED"
            });

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

    strings = await loadLocale("protocol");

    reportBtn.textContent = strings.reportButton;

    const user = await getUser();

    const roleName = user.role?.[userLang]?.name ?? "UNKNOWN ROLE";
    const roleTask = user.role?.[userLang]?.task ?? "NO TASK ASSIGNED";

    const alreadyDelivered = user.status === "DELIVERED";

    const lines = [

        { text: strings.confidential, bold: true },
        { text: "" },

        { text: strings.protocol, bold: true },
        { text: strings.archive, bold: true },
        { text: "" },

        { text: `${strings.dossier} ${passcode}` },
        { text: `${strings.assigned}: ${roleName}` },
        { text: "" },

        { text: strings.missionSubject, bold: true },
        { text: "" },

        { text: strings.intro1 },
        { text: strings.intro2 },
        { text: "" },
        
        { text: `‼️ ${strings.intro3}` },
        { text: "" },

        { text: strings.meeting },
        { text: "" },

        { text: `🗓️ ${strings.date}` },
        { text: `🕤 ${strings.time}` },
        { text: `📍 ${strings.location}` },
        { text: "" },

        { text: strings.taskIntro1 },
        { text: strings.taskIntro2 },
        { text: "" },

        { text: `📎 ${strings.task}: ${roleTask}` },
        { text: `❇️ ${strings.bonus}` },
        { text: "" },

        { text: strings.alert },
        { text: strings.report },
        { text: "" },

        { text: `${strings.locationReveal} ${strings.reload}` },
        { text: "" },

        { text: strings.absence },
        { text: "" },
        
        { text: strings.goodLuck }

    ];

    if (alreadyDelivered) {
        renderInstant(lines);
    } else {
        typeLines(lines);
    }

}

init();
