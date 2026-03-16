import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

async function init() {
    const strings = await loadLocale("report");

    // Title
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;

    // Explanation
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    // Rules
    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem"; // smaller than body
    rulesDiv.style.color = "#333"; // slightly lighter
}

init();
