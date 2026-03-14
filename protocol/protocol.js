import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const reportBtn = document.getElementById("reportBtn");

const typingSpeed = 30;
const linePause = 800;

const userLang = navigator.language.startsWith("it") ? "it" : "en";

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

    const user = await getUser();

    const roleName = user.role?.[userLang]?.name ?? "UNKNOWN ROLE";
    const roleTask = user.role?.[userLang]?.task ?? "NO TASK ASSIGNED";

    const lines = userLang === "it" ? [

        "ATTENZIONE: QUESTO ARTICOLO È CONFIDENZIALE, NON CONDIVIDERE QUESTE INFORMAZIONI CON NESSUNO",
        "",
        "PROTOCOLLO 1995",
        "ARCHIVIO 263",
        "",
        `DOSSIER ${passcode}`,
        `INCARICATO: ${roleName}`,
        "",
        "OGGETTO: AFFIDAMENTO NUOVA MISSIONE",
        "",
        "Questo non è un test.",
        "Sta succedendo qualcosa di strano in una città di nome Gallarate.",
        "Ci sono stati avvistamenti di oggetti non identificati e intercettazioni radio anomale.",
        "",
        "Il livello di allerta è altissimo ed è stata convocata una riunione.",
        "",
        "GIORNO: 26 Marzo",
        "ORARIO: 18:30 - 21:30",
        "LOCATION: CLASSIFICATO",
        "",
        "Dovrai portare a termine un task senza dirlo né farti vedere da nessuno.",
        "Potrebbero scoprire la tua identità e farti perdere un punto.",
        "",
        `DESCRIZIONE DEL TASK: ${roleTask}`,
        "",
        "BONUS TASK:",
        "Presenta una teoria complottista a tuo piacimento per guadagnare 5 punti.",
        "",
        "Dovrai tenere gli occhi aperti: succederanno molte cose strane.",
        "Scopri la vera identità dei tuoi compagni e denunciali utilizzando il pulsante qui sotto.",
        "",
        "La location finale sarà rivelata il giorno stesso dell'evento.",
        "Ricarica questa pagina per scoprirla e presentati in orario.",
        "",
        "La tua assenza sarà considerata molto sospetta.",
        "",
        "Buon lavoro."

    ] : [

        "WARNING: THIS DOCUMENT IS CONFIDENTIAL. DO NOT SHARE THIS INFORMATION.",
        "",
        "PROTOCOL 1995",
        "ARCHIVE 263",
        "",
        `DOSSIER ${passcode}`,
        `ASSIGNED AGENT: ${roleName}`,
        "",
        "SUBJECT: NEW MISSION ASSIGNMENT",
        "",
        "This is not a test.",
        "Something strange is happening in a city called Gallarate.",
        "There have been sightings of unidentified objects and anomalous radio interceptions.",
        "",
        "Alert level is extremely high and a meeting has been called.",
        "",
        "DATE: March 26",
        "TIME: 18:30 - 21:30",
        "LOCATION: CLASSIFIED",
        "",
        "You must complete a secret task without anyone noticing.",
        "They might discover your identity and cost you points.",
        "",
        `TASK DESCRIPTION: ${roleTask}`,
        "",
        "BONUS TASK:",
        "Present any conspiracy theory to earn 5 points.",
        "",
        "Stay alert: many strange things will happen.",
        "Discover the real identities of your companions and report them using the button below.",
        "",
        "The final location will be revealed on the day of the event.",
        "Reload this page to discover it and arrive on time.",
        "",
        "Your absence will be considered highly suspicious.",
        "",
        "Good luck."

    ];

    typeLines(lines);
}

init();
