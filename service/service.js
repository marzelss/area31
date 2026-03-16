import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const infoText = document.getElementById("infoText");
const usersList = document.getElementById("usersList");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

// Instruction text under heading
infoText.textContent = 
  "As a guest with linguistic limitations, you can pick up to 3 interpreters who will follow you around for the entire duration of the event. For each interpreter you earn 2 points.\nAfter the event, you can rate the interpreter a good service and let them earn an extra point.";
infoText.style.fontSize = "1.2rem";
infoText.style.marginBottom = "1.5rem";

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

    const chosenKeys = Object.keys(acceptedList);

    // --- Section 1: Pending applications ---
    const pendingUsers = Object.entries(data)
        .filter(([interpreterPasscode, user]) => 
            user.interpreter?.eligible === true &&
            !acceptedList[interpreterPasscode] &&
            !refusedList[interpreterPasscode]
        );

    const pendingSection = document.createElement("div");
    pendingSection.style.marginBottom = "2rem";

    const pendingTitle = document.createElement("div");
    pendingTitle.innerHTML = "<strong>Pending Interpreter Applications</strong>";
    pendingTitle.style.fontSize = "1.3rem";
    pendingTitle.style.marginBottom = "0.5rem";
    pendingSection.appendChild(pendingTitle);

    if (pendingUsers.length === 0 || chosenKeys.length >= 3) {
        const noPending = document.createElement("div");
        noPending.style.fontSize = "1.2rem";
        noPending.textContent = chosenKeys.length >= 3 
            ? "You've reached the maximum number of interpreters." 
            : "There are no pending applications at this moment.";
        pendingSection.appendChild(noPending);
    } else {
        pendingUsers.forEach(([interpreterPasscode, user]) => {
            const container = document.createElement("div");
            container.className = "userRow";
            container.style.marginBottom = "1rem";

            const nameDiv = document.createElement("div");
            nameDiv.textContent = user["real-name"] || "UNKNOWN";
            nameDiv.style.fontSize = "1.5rem";
            nameDiv.style.fontWeight = "normal";
            container.appendChild(nameDiv);

            const buttonsDiv = document.createElement("div");
            buttonsDiv.style.display = "flex";
            buttonsDiv.style.gap = "1rem";
            buttonsDiv.style.marginTop = "0.5rem";

            const acceptBtn = document.createElement("button");
            acceptBtn.textContent = "ACCEPT";
            acceptBtn.onclick = async () => {
                await update(ref(db, `${passcode}/service/interpreter`), {
                    [interpreterPasscode]: { name: user["real-name"], passcode: interpreterPasscode }
                });
                const guestName = guestData["real-name"] || "UNKNOWN";
                await update(ref(db, `${interpreterPasscode}/interpreter/client`), {
                    [passcode]: { name: guestName, passcode: passcode }
                });
                // Force reload the page
                window.location.reload();
            };

            const refuseBtn = document.createElement("button");
            refuseBtn.textContent = "REFUSE";
            refuseBtn.onclick = async () => {
                await update(ref(db, `${passcode}/service/refused`), {
                    [interpreterPasscode]: { name: user["real-name"], passcode: interpreterPasscode }
                });
                // Force reload the page
                window.location.reload();
            };

            buttonsDiv.appendChild(acceptBtn);
            buttonsDiv.appendChild(refuseBtn);
            container.appendChild(buttonsDiv);
            pendingSection.appendChild(container);
        });
    }

    usersList.appendChild(pendingSection);

    // --- Section 2: Chosen interpreters ---
    function renderChosenSection() {
        const prev = document.getElementById("chosenSection");
        if (prev) prev.remove();

        const chosenList = guestData.service?.interpreter || {};
        const keys = Object.keys(chosenList);
        if (keys.length === 0) return;

        const chosenSection = document.createElement("div");
        chosenSection.id = "chosenSection";
        chosenSection.style.marginBottom = "2rem";

        const chosenTitle = document.createElement("div");
        chosenTitle.innerHTML = "<strong>Interpreters Chosen</strong>";
        chosenTitle.style.fontSize = "1.3rem";
        chosenTitle.style.marginBottom = "0.5rem";
        chosenSection.appendChild(chosenTitle);

        keys.forEach(key => {
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.marginBottom = "0.5rem";

            const nameDiv = document.createElement("div");
            nameDiv.textContent = chosenList[key].name;
            nameDiv.style.fontSize = "1.3rem";
            nameDiv.style.fontWeight = "normal";
            nameDiv.style.marginRight = "1rem";

            const rateBtn = document.createElement("button");
            rateBtn.textContent = "RATE GOOD SERVICE";
            rateBtn.onclick = () => {
                // Custom popup
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

                const title = document.createElement("div");
                title.textContent = `Do you want to rate ${chosenList[key].name} good service?`;
                title.style.fontSize = "1.3rem";
                title.style.marginBottom = "1rem";

                const message = document.createElement("div");
                message.textContent = "The user will earn 1 extra point.";
                message.style.fontSize = "1.1rem";
                message.style.marginBottom = "1.5rem";

                const buttons = document.createElement("div");
                buttons.style.display = "flex";
                buttons.style.gap = "1rem";

                const confirmBtn = document.createElement("button");
                confirmBtn.textContent = "CONFIRM";
                confirmBtn.onclick = () => popup.remove();

                const cancelBtn = document.createElement("button");
                cancelBtn.textContent = "CANCEL";
                cancelBtn.onclick = () => popup.remove();

                buttons.appendChild(confirmBtn);
                buttons.appendChild(cancelBtn);
                popup.appendChild(title);
                popup.appendChild(message);
                popup.appendChild(buttons);

                document.body.appendChild(popup);
            };

            container.appendChild(nameDiv);
            container.appendChild(rateBtn);
            chosenSection.appendChild(container);
        });

        usersList.appendChild(chosenSection);
    }

    // --- Section 3: Refused interpreters ---
    function renderRefusedSection() {
        const prev = document.getElementById("refusedSection");
        if (prev) prev.remove();

        const refusedListObj = guestData.service?.refused || {};
        const keys = Object.keys(refusedListObj);
        if (keys.length === 0) return;

        const refusedSection = document.createElement("div");
        refusedSection.id = "refusedSection";
        refusedSection.style.marginBottom = "2rem";

        const refusedTitle = document.createElement("div");
        refusedTitle.innerHTML = "<strong>Interpreters Rejected</strong>";
        refusedTitle.style.fontSize = "1.3rem";
        refusedTitle.style.marginBottom = "0.5rem";
        refusedSection.appendChild(refusedTitle);

        keys.forEach(key => {
            const div = document.createElement("div");
            div.textContent = refusedListObj[key].name;
            div.style.fontSize = "1.3rem";
            div.style.fontWeight = "normal";
            div.style.marginBottom = "0.3rem";
            refusedSection.appendChild(div);
        });

        usersList.appendChild(refusedSection);
    }

    renderChosenSection();
    renderRefusedSection();
}

loadServicePage();
