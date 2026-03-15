import { db } from "../sources/firebase.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const answersContainer = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

let strings;
let questionIndex = 0;
let selectedAnswer = null;

function renderQuestion() {

    const q = strings.questions[questionIndex];

    terminal.innerHTML = `<strong>${q.question}</strong>`;
    answersContainer.innerHTML = "";
    selectedAnswer = null;

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

    if (q.rightAnswer && selectedAnswer !== q.rightAnswer) {

        terminal.innerHTML = strings.ineligibleResult;
        answersContainer.innerHTML = "";
        nextBtn.style.display = "none";

        await update(ref(db, `${passcode}/interpreter`), {
            eligible: false
        });

        return;

    }

    questionIndex++;

    if (questionIndex >= strings.questions.length) {

        terminal.innerHTML = strings.pendingResult;
        answersContainer.innerHTML = "";
        nextBtn.style.display = "none";

        await update(ref(db, `${passcode}/interpreter`), {
            eligible: true
        });

        return;

    }

    renderQuestion();

}

async function init() {

    strings = await loadLocale("interview");

    nextBtn.textContent = "NEXT";

    nextBtn.onclick = nextQuestion;

    renderQuestion();

}

init();
