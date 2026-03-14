import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const reportBtn = document.getElementById("reportBtn");
const promotionBtn = document.getElementById("promotionBtn");
const presentationBtn = document.getElementById("presentationBtn");

const typingSpeed = 15;
const linePause = 500;
const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;
const realName = sessionStorage.getItem("realName");
const passcode = sessionStorage.getItem("passcode");
if (!passcode) window.location.href = "../index.html";

const storage = getStorage();

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
    if (lineObj.bold) return `<strong>${lineObj.text}</strong>`;
    return lineObj.text;
}

function renderInstant(lines) {
    terminal.innerHTML = lines.map(l => formatLine(l)).join("\n");
    reportBtn.style.display = "inline-block";
    promotionBtn.style.display = "inline-block";
    presentationBtn.style.display = "inline-block";
}

function typeLines(lines) {
    let currentLine = 0, currentChar = 0;

    function type() {
        if (currentLine >= lines.length) {
            terminal.innerHTML += "\n";
            reportBtn.style.display = "inline-block";
            promotionBtn.style.display = "inline-block";
            presentationBtn.style.display = "inline-block";
            update(ref(db, passcode), { status: "DELIVERED" });
            return;
        }

        const lineObj = lines[currentLine];
        const line = lineObj.text || "";
        const visibleText = lineObj.bold ? `<strong>${line.substring(0, currentChar)}</strong>` : line.substring(0, currentChar);
        const previousLines = lines.slice(0, currentLine).map(formatLine).join("\n");

        terminal.innerHTML = previousLines + "\n" + visibleText;
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

function formatColonLine(text) {
    if (!text.includes(":")) return text;
    const [prefix, rest] = text.split(":");
    return `<strong>${prefix}:</strong>${rest}`;
}

async function init() {
    strings = await loadLocale("protocol");

    reportBtn.textContent = strings.reportButton;
    promotionBtn.textContent = strings.promotionButton;
    presentationBtn.textContent = strings.presentationButton;
    
    // Redirect buttons
    reportBtn.onclick = () => window.location.href = "../report/report.html";
    promotionBtn.onclick = () => window.location.href = "../promotion/promotion.html";
    
    // Presentation upload
    presentationBtn.onclick = () => {
        const email = strings.presentation.address;
        const subject = encodeURIComponent(strings.presentation.subject);
        const body = encodeURIComponent(strings.presentation.body);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

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
        
        { text: strings.intro3 }, 
        { text: "" },
        
        { text: strings.meeting }, 
        { text: "" },
        
        { text: formatColonLine(strings.date) }, 
        { text: formatColonLine(strings.time) }, 
        { text: formatColonLine(strings.location) }, 
        { text: "" },
        
        { text: strings.taskIntro1 }, 
        { text: strings.taskIntro2 }, 
        { text: "" },
        
        { text: formatColonLine(`${strings.task}: ${roleTask}`) }, 
        { text: formatColonLine(strings.bonus) }, 
        { text: "" },
        
        { text: strings.alert }, 
        { text: strings.report }, 
        { text: "" },
        
        { text: `${strings.locationReveal} ${strings.reload}` }, 
        { text: "" },
        
        { text: strings.absence }, 
        { text: "" },
        
        { text: strings.goodLuck }, 
        { text: "" },
    ];

    alreadyDelivered ? renderInstant(lines) : typeLines(lines);
}

init();
