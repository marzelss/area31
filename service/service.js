import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const infoText = document.getElementById("infoText");
const usersList = document.getElementById("usersList");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

// Instruction text under heading
infoText.textContent = 
  "As a guest with linguistic limitations, you can pick up to 3 interpreters who will follow you around for the entire duration of the event. For each interpreter you earn 2 points.\nAfter the event, you can rate the interpreter a good service and let them earn 3 extra points.";

async function loadServicePage() {
    const snapshot = await get(ref(db));
    if (!snapshot.exists()) {
        usersList.innerHTML = "No users found.";
        return;
    }

    const data = snapshot.val();
    const guestData = data[passcode] || {};
    const acceptedList = guestData.service?.interpreter || {};
    const refusedList = guestData.service?.refused || {};

    // --- Section 1: Pending applications ---
    const pendingSection = document.createElement("div");
    pendingSection.style.marginBottom = "2rem";
    
    // TITLE + INFO TEXT
    const pendingTitle = document.createElement("div");
    pendingTitle.innerHTML = "<strong>Pending Interpreter Applications</strong>";
    pendingTitle.style.fontSize = "1.3rem";
    pendingTitle.style.marginBottom = "0.5rem";
    pendingSection.appendChild(pendingTitle);
    
    // info text under the title
    infoText.style.fontSize = "1.2rem";      // same size as other pages
    infoText.style.lineHeight = "1.5";
    infoText.style.marginBottom = "1rem";    // spacing
    pendingSection.appendChild(infoText);
    
    // --- populate pending users ---
    if (pendingUsers.length === 0) {
        const noPending = document.createElement("div");
        noPending.textContent = "There are no pending applications at this moment.";
        noPending.style.fontSize = "1.2rem";
        pendingSection.appendChild(noPending);
    } else {
        pendingUsers.forEach(([interpreterPasscode, user]) => {
            const container = document.createElement("div");
            container.className = "userRow";
            container.style.marginBottom = "1rem";
    
            const nameDiv = document.createElement("div");
            nameDiv.textContent = user["real-name"] || "UNKNOWN";
            nameDiv.style.fontSize = "1.5rem";
            nameDiv.style.fontWeight = "bold"; // pending users stay bold
            container.appendChild(nameDiv);
    
            const buttonsDiv = document.createElement("div");
            buttonsDiv.style.display = "flex";
            buttonsDiv.style.gap = "1rem";
            buttonsDiv.style.marginTop = "0.5rem";
    
            // ACCEPT/REFUSE buttons...
            buttonsDiv.appendChild(acceptBtn);
            buttonsDiv.appendChild(refuseBtn);
            container.appendChild(buttonsDiv);
    
            pendingSection.appendChild(container);
        });
    }
    
    // --- Section 2: Chosen interpreters ---
    function renderChosenSection() {
        const prev = document.getElementById("chosenSection");
        if (prev) prev.remove();
    
        const chosenList = guestData.service?.interpreter || {};
        const chosenKeys = Object.keys(chosenList);
        if (chosenKeys.length === 0) return;
    
        const chosenSection = document.createElement("div");
        chosenSection.id = "chosenSection";
        chosenSection.style.marginBottom = "2rem";
    
        const chosenTitle = document.createElement("div");
        chosenTitle.innerHTML = "<strong>Interpreters Chosen</strong>";
        chosenTitle.style.fontSize = "1.3rem";
        chosenTitle.style.marginBottom = "0.5rem";
        chosenSection.appendChild(chosenTitle);
    
        chosenKeys.forEach(key => {
            const div = document.createElement("div");
            div.textContent = chosenList[key].name;
            div.style.fontSize = "1.3rem";
            div.style.fontWeight = "normal"; // ❌ removed bold
            div.style.marginBottom = "0.3rem";
            chosenSection.appendChild(div);
        });
    
        usersList.appendChild(chosenSection);
    }
    
    // --- Section 3: Refused interpreters ---
    function renderRefusedSection() {
        const prev = document.getElementById("refusedSection");
        if (prev) prev.remove();
    
        const refusedListObj = guestData.service?.refused || {};
        const refusedKeys = Object.keys(refusedListObj);
        if (refusedKeys.length === 0) return;
    
        const refusedSection = document.createElement("div");
        refusedSection.id = "refusedSection";
        refusedSection.style.marginBottom = "2rem";
    
        const refusedTitle = document.createElement("div");
        refusedTitle.innerHTML = "<strong>Interpreters Rejected</strong>";
        refusedTitle.style.fontSize = "1.3rem";
        refusedTitle.style.marginBottom = "0.5rem";
        refusedSection.appendChild(refusedTitle);
    
        refusedKeys.forEach(key => {
            const div = document.createElement("div");
            div.textContent = refusedListObj[key].name;
            div.style.fontSize = "1.3rem";
            div.style.fontWeight = "normal"; // ❌ removed bold
            div.style.marginBottom = "0.3rem";
            refusedSection.appendChild(div);
        });
    
        usersList.appendChild(refusedSection);
    }

    // initial render of chosen/refused
    renderChosenSection();
    renderRefusedSection();
}

loadServicePage();
