import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const myName = sessionStorage.getItem("realName");
const passcode = sessionStorage.getItem("passcode"); // <--- add this

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

async function init() {

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">PRESENTATIONS</strong>`;

    // --- Explanation ---
    explanationDiv.textContent = "Select which guests have a presentation.";
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
        const presentation = user["presentation"];

        // Filtering rules
        if (
            realName !== myName &&
            presentation !== true
        ) {

            const button = document.createElement("button");
            button.textContent = realName;

            button.onclick = async () => {
                try {
                    // 1️⃣ Mark presentation as true
                    await update(ref(db, `${code}`), { presentation: true });
            
                    // 2️⃣ Add 5 points
                    const pointsRef = ref(db, `${code}/points`);
                    const pointsSnap = await get(pointsRef);
                    const currentPoints = pointsSnap.exists() ? pointsSnap.val() : 0;
                    await set(pointsRef, currentPoints + 5);
            
                    button.remove();
                } catch (err) {
                    console.error("Failed to update user:", err);
                }
            };

            rulesDiv.appendChild(button);

        }

    }

}

init();
