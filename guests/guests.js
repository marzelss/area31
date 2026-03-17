import { db } from "../sources/firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const myName = sessionStorage.getItem("realName");
const passcode = sessionStorage.getItem("passcode"); // <--- add this

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
            
                // 1️⃣ Mark the guest as arrived
                await update(ref(db, `${code}`), { arrived: true });
            
                // 2️⃣ Propagate to other users
                const snapshotAll = await get(ref(db));
                if (snapshotAll.exists()) {
                    const allUsers = snapshotAll.val();
            
                    for (const [otherCode, otherUser] of Object.entries(allUsers)) {
            
                        // Skip current user and the guest that just arrived
                        if (otherCode === passcode || otherCode === code) continue;
            
                        const userOptionsRef = ref(db, `${otherCode}/entries/userOptions`);
                        
                        // Push a new object as a child
                        await update(userOptionsRef, {
                            [code]: {
                                passcode: code,
                                "real-name": user["real-name"]
                            }
                        });
                    }
                }
            
                // 3️⃣ Remove button
                button.remove();
            };

            rulesDiv.appendChild(button);

        }

    }

}

init();
