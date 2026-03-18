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

const typingSpeed = 10;
const linePause = 300;
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

// Generic typewriter for any set of lines
function typeLinesWithCallback(lines, callback) {
    let currentLine = 0;
    let currentChar = 0;

    function type() {
        if (currentLine >= lines.length) {
            terminal.innerHTML += "\n";
            if (callback) callback();
            return;
        }

        const line = lines[currentLine];
        const previousLines = lines.slice(0, currentLine).join("\n");
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

// --- First reveal sequence ---
function typeLocationReveal() {
    const revealLines = [
        strings.locationReveal1,
        strings.locationReveal2,
        strings.loadingLocation1,
        strings.loadingLocation2,
        strings.locationReveal3
    ];

    typeLinesWithCallback(revealLines, showLocationPopup);
}

// --- CUSTOM POPUP FOR LOCATION REVEAL ---
function showLocationPopup() {
    // Create popup container
    const popup = setupPopup();

    // Create message div (hardcoded for this popup)
    const messageDiv = document.createElement("div");
    messageDiv.textContent = strings.locationReveal4; // hardcoded string
    messageDiv.style.fontSize = "1.2rem";
    messageDiv.style.marginBottom = "1.5rem";

    // Create buttons container
    const buttonsDiv = document.createElement("div");

    // Only one OK button
    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.fontFamily = "monospace";
    okBtn.style.padding = "0.5rem 1rem";
    okBtn.style.backgroundColor = "rgba(0,0,0,0.9)";
    okBtn.style.color = "#fff";
    okBtn.style.border = "none";
    okBtn.style.borderRadius = "4px";
    okBtn.style.cursor = "pointer";

    // Remove popup on click
    okBtn.addEventListener("click", async () => {
        // Remove popup
        document.body.removeChild(popup);
    
        // Clear terminal
        terminal.innerHTML = "";
    
        // Start second reveal sequence
        const nextLines = [
            strings.locationReveal5,
            strings.locationReveal6,
            strings.locationReveal7
        ];
    
        typeLinesWithCallback(nextLines, async () => {
            // Set user status to UNLOCKED in database
            await update(ref(db, passcode), { status: "UNLOCKED" });
    
            // Reload page after 2 seconds
            setTimeout(() => location.reload(), 2000);
        });
    });

    buttonsDiv.appendChild(okBtn);

    // Assemble popup
    popup.appendChild(messageDiv);
    popup.appendChild(buttonsDiv);

    document.body.appendChild(popup);
}

// Reuse your generic popup container setup
function setupPopup() {
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.backgroundColor = "rgba(0,0,0,0.7)";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = "10000";
    popup.style.color = "#fff";
    popup.style.fontFamily = "monospace";
    popup.style.padding = "1.5rem";
    return popup;
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
    const alreadyDelivered = user.status === "DELIVERED" || user.status === "UNLOCKED";

    if (user.status === "UNLOCKED") {

        const unlockedLines = [
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
            
            { text: strings.absence }, 
            { text: "" },
            
            { text: strings.goodLuck }, 
            { text: "" },
        ];
        renderInstant(unlockedLines, isNonItalianSpeaker)
        return;
    }

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

    const lat = 45.6560187;
    const lng = 8.7967484;

    const mapDiv = document.getElementById("map");
    mapDiv.style.display = "block";

        // --- Add label above the map ---
    let mapLabel = document.getElementById("mapLabel");
    if (!mapLabel) {
        mapLabel = document.createElement("div");
        mapLabel.id = "mapLabel";
        mapLabel.style.fontFamily = "monospace";
        mapLabel.style.color = "rgba(0,0,0,0.7)";
        mapLabel.style.padding = "1rem";
        mapLabel.style.marginBottom = "0.5rem";
        mapLabel.style.borderRadius = "4px";
        mapLabel.style.textAlign = "center";
        mapLabel.style.maxWidth = "600px";
        mapLabel.style.margin = "0 auto 0.5rem auto"; // center above map

        mapDiv.parentNode.insertBefore(mapLabel, mapDiv);
    }

    mapLabel.textContent = strings.locationReveal8;

    const map = L.map('map').setView([lat, lng], 20);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '© OpenStreetMap'
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);

    marker.bindPopup(`
        <strong>MISSION LOCATION</strong><br>
        <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank">
        Via Cadore 1, Gallarate
        </a>
    `);
}

init();
