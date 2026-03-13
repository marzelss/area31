import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const nameField = document.getElementById("nameField");
const nameNextBtn = document.getElementById("nameNext");

const typingSpeed = 30;
const linePause = 800;

const userLang = navigator.language.startsWith("it") ? "it" : "en";

let lines = [];
let buttonText = "";
let loadingStrings;

async function showLoadingSequence(loadingStrings) {

    const steps = [
        loadingStrings.passcode1,
        loadingStrings.passcode2,
        loadingStrings.passcode3
    ];

    for (const step of steps) {

        await animateDots(step);

    }

}

function animateDots(text) {
    return new Promise(resolve => {
        let dots = 1;
        let cycles = 0;

        // Create a new line first
        terminal.innerHTML += `\n${text}`;

        const interval = setInterval(() => {
            // Replace the last line with the text + dots
            const lines = terminal.innerHTML.split("\n");
            lines[lines.length - 1] = `${text}${".".repeat(dots)}`;
            terminal.innerHTML = lines.join("\n") + '<span class="cursor">|</span>';

            dots++;
            if (dots > 3) {
                dots = 1;
                cycles++;
            }

            if (cycles >= 2) { // repeat twice
                clearInterval(interval);
                // Remove cursor after finishing
                lines[lines.length - 1] = `${text}...`;
                terminal.innerHTML = lines.join("\n");
                resolve();
            }

        }, 350);
    });
}

async function checkPasscode(passcode) {

    const passRef = ref(db, passcode);
    const snapshot = await get(passRef);

    if (snapshot.exists()) {
        return snapshot.val();
    }

    return null;
}

function showIntruderScreen() {

    const intruderStrings = loadingStrings ? loadingStrings.intruder : {
        warning: "ERROR! INTRUDER!",
        reload: "Reload the page to try again."
    };

    document.body.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            height:100vh;
            font-family:monospace;
            text-align:center;
            background-color:#222;
            color:#ff4444;
        ">
            <div style="font-size:60px; animation: blink 0.8s infinite;">⚠️</div>
            <div style="font-size:28px; margin-top:15px; animation: blink 0.8s infinite;">
                ${intruderStrings.warning}
            </div>
            <div style="font-size:16px; margin-top:20px; color:#fff;">
                ${intruderStrings.reload}
            </div>
        </div>
    `;
}

function startTyping() {

    let currentLine = 0;
    let currentChar = 0;

    function typeLine() {

        if (currentLine >= lines.length) {

            terminal.innerHTML += "\n";

            nameField.style.display = "inline-block";
            nameNextBtn.style.display = "inline-block";
            nameNextBtn.textContent = buttonText;

            nameNextBtn.disabled = true;
            nameNextBtn.style.opacity = 0.5;

            nameField.addEventListener("input", () => {

                if (nameField.value.length >= 10) {
                    nameNextBtn.disabled = false;
                    nameNextBtn.style.opacity = 1;
                } else {
                    nameNextBtn.disabled = true;
                    nameNextBtn.style.opacity = 0.5;
                }

            });

            nameNextBtn.onclick = async () => {

                const passcode = nameField.value.trim();

                // Hide input/button immediately
                nameField.style.display = "none";
                nameNextBtn.style.display = "none";

                // Check passcode
                const result = await checkPasscode(passcode);

                if (result) {
                    // Only show loading if passcode is valid
                    await showLoadingSequence(loadingStrings);

                    sessionStorage.setItem("agentName", result["real-name"]);
                    sessionStorage.setItem("passcode", passcode);

                    window.location.href = "../protocol/protocol.html";

                } else {
                    showIntruderScreen();
                }
            };

            return; // Important: stop typing further
        }

        // --- continue typing current line ---
        const line = lines[currentLine];

        terminal.innerHTML =
            lines.slice(0, currentLine).join("\n") +
            "\n" +
            line.substring(0, currentChar) +
            '<span class="cursor">|</span>';

        if (currentChar < line.length) {

            currentChar++;
            setTimeout(typeLine, typingSpeed);

        } else {

            currentLine++;
            currentChar = 0;
            setTimeout(typeLine, linePause);

        }

    }

    typeLine(); // start the typewriter
}

async function init() {

    const response = await fetch(`../locales/${userLang}.json`);
    const data = await response.json();

    lines = [data.nameInput.prompt];
    buttonText = data.nameInput.button;
    loadingStrings = data.loading;

    startTyping();
}

init();
