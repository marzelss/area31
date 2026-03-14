import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

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

function typeLines(lines) {

    let currentLine = 0;
    let currentChar = 0;

    function type() {

        if (currentLine >= lines.length) {

            terminal.innerHTML += "\n";

            reportBtn.style.display = "inline-block";

            return;
        }

        const line = lines[currentLine];

        terminal.innerHTML =
            lines.slice(0, currentLine).join("\n") +
            "\n" +
            line.substring(0, currentChar) +
            '<span class="cursor">|</span>';

        // auto-scroll terminal
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

    // Load localisation file
    const response = await fetch(`../locales/${userLang}.json`);
    const data = await response.json();

    strings = data.protocol;

    // set button text
    reportBtn.textContent = strings.reportButton;

    const user = await getUser();

    const roleName = user.role?.[userLang]?.name ?? "UNKNOWN ROLE";
    const roleTask = user.role?.[userLang]?.task ?? "NO TASK ASSIGNED";

    const lines = [

        strings.confidential,
        "",
        strings.protocol,
        strings.archive,
        "",
        `${strings.dossier} ${passcode}`,
        `${strings.assigned}: ${roleName}`,
        "",
        strings.missionSubject,
        "",
        strings.intro1,
        strings.intro2,
        strings.intro3,
        "",
        strings.meeting,
        "",
        strings.date,
        strings.time,
        strings.location,
        "",
        strings.taskIntro1,
        strings.taskIntro2,
        "",
        `${strings.task}: ${roleTask}`,
        "",
        strings.bonus,
        "",
        strings.alert,
        strings.report,
        "",
        strings.locationReveal,
        strings.reload,
        "",
        strings.absence,
        "",
        strings.goodLuck

    ];

    typeLines(lines);
}

init();
