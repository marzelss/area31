import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const myName = sessionStorage.getItem("realName");

async function init() {

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">GUEST LIST</strong>`;

    // --- Explanation ---
    explanationDiv.textContent = "Select which guests have arrived.";
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";

    const snapshot = await get(ref(db));

    if (!snapshot.exists()) {
        rulesDiv.textContent = "No guests found.";
        return;
    }

    const data = snapshot.val();

    for (const [code, user] of Object.entries(data)) {

        const realName = user["real-name"];
        const arrived = user["arrived"];

        // Filtering rules
        if (
            realName !== myName &&
            arrived !== true
        ) {

            const button = document.createElement("button");
            button.textContent = realName;

            button.onclick = async () => {

                await update(ref(db, `${code}`), {
                    arrived: true
                });

                button.remove();

            };

            rulesDiv.appendChild(button);

        }

    }

}

init();
