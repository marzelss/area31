import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";
import { infoLogEvent, errorLogEvent, dbLogEvent, promotionLogEvent } from "../utils/analytics.js";

const terminal = document.getElementById("terminal");
const answersContainer = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;
let questionIndex = 0;
let selectedAnswer = null;

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

async function checkClient() {

    const snapshot = await get(ref(db, `${passcode}/interpreter/client`));

    if (!snapshot.exists()) {
        return null;
    }

    const clients = snapshot.val();
    const firstKey = Object.keys(clients)[0];

    if (!firstKey) {
        return null;
    }

    return clients[firstKey]["name"];

}

async function checkEligibility() {

    const snapshot = await get(ref(db, `${passcode}/interpreter/eligible`));

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();

}

function showResult(eligible) {

    answersContainer.innerHTML = "";

    nextBtn.style.display = "none";

    if (eligible === true) {
        infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Pending result");
        terminal.textContent = strings.pendingResult;
    } else {
        infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Ineligible result");
        terminal.textContent = strings.ineligibleResult;
    }

}

function renderQuestion() {

    const q = strings.questions[questionIndex];

    terminal.innerHTML = `<strong>${q.question}</strong>`;
    answersContainer.innerHTML = "";
    selectedAnswer = null;

    nextBtn.style.display = "none";

    q.answers.forEach(answer => {

        const div = document.createElement("div");
        div.className = "answer";

        const box = document.createElement("div");
        box.className = "checkbox";

        const text = document.createElement("div");
        text.textContent = answer;

        div.appendChild(box);
        div.appendChild(text);

        div.onclick = () => {

            document.querySelectorAll(".checkbox")
                .forEach(c => c.classList.remove("checked"));

            box.classList.add("checked");

            selectedAnswer = answer;

            nextBtn.style.display = "inline-block";

        };

        answersContainer.appendChild(div);

    });

}

async function nextQuestion() {

    const q = strings.questions[questionIndex];

    // check if question has a correct answer
    if (q.rightAnswer) {
        if (selectedAnswer !== q.rightAnswer) {
            infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Wrong answer");
            terminal.innerHTML = strings.ineligibleResult;
            answersContainer.innerHTML = "";
            nextBtn.style.display = "none";

            await update(ref(db, `${passcode}/interpreter`), {
                eligible: false
            });

            infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Interview terminated: Ineligible");
            return; // STOP HERE
        }
        infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Correct answer");

    }

    // move to next question
    questionIndex++;

    // if finished
    if (questionIndex >= strings.questions.length) {

        terminal.innerHTML = strings.pendingResult;
        answersContainer.innerHTML = "";
        nextBtn.style.display = "none";

        await update(ref(db, `${passcode}/interpreter`), {
            eligible: true
        });

        promotionLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Interview completed");
        return;
    }

    // otherwise load next question
    renderQuestion();
}

async function init() {

    strings = await loadLocale("interview");

    nextBtn.textContent = strings.nextButton;
    backBtn.textContent = strings.backButton;

    backBtn.onclick = () => {
        infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: BACK");
        window.location.href = "../promotion/promotion.html";
    };

    // NEW: check if interpreter already has a client
    const clientName = await checkClient();

    if (clientName !== null) {
        infoLogEvent("User selected button: ASK FOR PROMOTION: APPLY: Application approved: Viewing client");

        terminal.innerHTML = `
            ${strings.positiveResult1}<br><br>
            <strong>${clientName}</strong><br><br>
            ${strings.positiveResult2}
        `;

        answersContainer.innerHTML = "";
        nextBtn.style.display = "none";

        return;
    }

    const eligible = await checkEligibility();

    if (eligible !== null) {
        showResult(eligible);
        return;
    }

    nextBtn.onclick = nextQuestion;

    renderQuestion();

}

init();
