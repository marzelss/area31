import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";
import { loadLocale } from "../utils/i18n.js";
import { infoLogEvent, errorLogEvent, dbLogEvent } from "../utils/analytics.js";

const terminal = document.getElementById("terminal");
const reportBtn = document.getElementById("reportBtn");
const promotionBtn = document.getElementById("promotionBtn");
const serviceBtn = document.getElementById("serviceBtn");
const presentationBtn = document.getElementById("presentationBtn");

const typingSpeed = 15;
const linePause = 500;
const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;
let presentationStrings;
const realName = sessionStorage.getItem("realName");
const passcode = sessionStorage.getItem("passcode");

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

function renderInstant(lines, isNonItalianSpeaker) {
    terminal.innerHTML = lines.map(l => formatLine(l)).join("\n");

    reportBtn.style.display = "inline-block";

    if (isNonItalianSpeaker) {
        serviceBtn.style.display = "inline-block";
    } else {
        promotionBtn.style.display = "inline-block";
    }
    
    presentationBtn.style.display = "inline-block";
}

function typeLines(lines, isNonItalianSpeaker) {
    let currentLine = 0, currentChar = 0;

    function type() {
        if (currentLine >= lines.length) {
            terminal.innerHTML += "\n";
            reportBtn.style.display = "inline-block";
            if (isNonItalianSpeaker) {
                serviceBtn.style.display = "inline-block";
            } else {
                promotionBtn.style.display = "inline-block";
            }
            presentationBtn.style.display = "inline-block";
            infoLogEvent("User read protocol.");
            dbLogEvent("Update:", { status: "DELIVERED" });
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

function typeLocationReveal() {
    const revealLines = [
        strings.locationReveal1,
        strings.locationReveal2,
        strings.locationReveal3
    ];

    let currentLine = 0;
    let currentChar = 0;

    function type() {
        if (currentLine >= revealLines.length) {
            terminal.innerHTML += "\n";
            return;
        }

        const line = revealLines[currentLine];
        const previousLines = revealLines.slice(0, currentLine).join("\n");
        const visibleText = line.substring(0, currentChar);

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

async function loadFullProtocol(strings) {
    const user = await getUser();
    presentationStrings = await loadLocale("presentation");

    // Load buttons with texts
    reportBtn.textContent = strings.reportButton;
    promotionBtn.textContent = strings.promotionButton;
    serviceBtn.textContent = strings.serviceButton;
    presentationBtn.textContent = strings.presentationButton;
    
    // Redirect buttons
    reportBtn.onclick = () => window.location.href = "../report/report.html";
    promotionBtn.onclick = () => window.location.href = "../promotion/promotion.html";
    serviceBtn.onclick = () => window.location.href = "../service/service.html";
    presentationBtn.onclick = () => {
        infoLogEvent("User selected button: SEND PRESENTATION");
        const email = presentationStrings.address;
        const subject = encodeURIComponent(presentationStrings.subject);
        const body = encodeURIComponent(presentationStrings.body);
        // create a temporary <a> element
        const a = document.createElement("a");
        a.href = `mailto:${email}?subject=${subject}&body=${body}`;
        a.style.display = "none";
        // append to body
        document.body.appendChild(a);
        // trigger click
        a.click();
        // remove it
        document.body.removeChild(a);
    };

    // Define text
    const isNonItalianSpeaker = user["non-italian-speaker"] === true;
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

    alreadyDelivered
    ? renderInstant(lines, isNonItalianSpeaker)
    : typeLines(lines, isNonItalianSpeaker);
}

async function init() {
    
    // Load strings
    strings = await loadLocale("protocol");

    // Determine status and reveal time
    const user = await getUser();
    const status = user.status;
    const revealDate = new Date("2026-03-25T18:00:00+01:00");
    const isRevealTime = new Date() >= revealDate;

    // If location was not revealed yet and it's time
    if (isRevealTime && status !== "UNLOCKED") {
        typeLocationReveal();
        return; // stop here, skip everything else
    }

    // If location was already revealed
    if (isRevealTime && status === "UNLOCKED") {
        initMap();
    }

    // Load full protocol
    await loadFullProtocol(strings)
}

function initMap() {

    const lat = 45.65605;
    const lng = 8.79769; 

    const mapDiv = document.getElementById("map");
    mapDiv.style.display = "block";

    const map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '© OpenStreetMap'
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);

    marker.bindPopup(`
        <strong>MISSION LOCATION</strong><br>
        <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank">
        Open in Maps
        </a>
    `);
}

init();
