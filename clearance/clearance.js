import { db } from '../sources/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const nameField = document.getElementById("nameField");
const nameNextBtn = document.getElementById("nameNext");

const typingSpeed = 30;
const linePause = 800;

const userLang = navigator.language.startsWith("it") ? "it" : "en";

let lines = [];
let buttonText = "";

async function checkPasscode(passcode) {

    const passRef = ref(db, passcode);
    const snapshot = await get(passRef);

    if (snapshot.exists()) {
        return snapshot.val();
    }

    return null;
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

                if (nameField.value.length >= 8) {
                    nameNextBtn.disabled = false;
                    nameNextBtn.style.opacity = 1;
                } else {
                    nameNextBtn.disabled = true;
                    nameNextBtn.style.opacity = 0.5;
                }

            });

            nameNextBtn.onclick = async () => {

                const passcode = nameField.value.trim();

                const result = await checkPasscode(passcode);

                if (result) {

                    sessionStorage.setItem("userPasscode", passcode);
                    sessionStorage.setItem("realName", result["real-name"]);

                    window.location.href = "../nextPage.html";

                } else {

                    terminal.innerHTML += "\nACCESS DENIED\n";

                }

            };

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
            setTimeout(typeLine, typingSpeed);

        } else {

            currentLine++;
            currentChar = 0;
            setTimeout(typeLine, linePause);

        }
    }

    typeLine();
}

async function init() {

    const response = await fetch(`../locales/${userLang}.json`);
    const data = await response.json();

    lines = [data.nameInput.prompt];
    buttonText = data.nameInput.button;

    startTyping();
}

init();
