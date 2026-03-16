import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

async function init() {
    const strings = await loadLocale("report");

    // --- Title ---
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;

    // --- Explanation ---
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    // --- Rules ---
    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";

    // --- Fetch users from Firebase ---
    const snapshot = await get(ref(db, "/"));
    const users = snapshot.exists() ? snapshot.val() : {};

    const arrivedUsers = [];
    const rolesArray = [];

    // Filter users who arrived
    Object.entries(users).forEach(([userPasscode, userData]) => {
        if (userData.arrived === true) {
            const userName = userData["real-name"];
            arrivedUsers.push({ passcode: userPasscode, userName });

            // save role object
            if (userData.role) {
                rolesArray.push({
                    passcode: userPasscode,
                    roleIt: userData.role.it.name,
                    roleEn: userData.role.en.name
                });
            }
        }
    });

    // --- User Dropdown ---
    const userLabel = document.createElement("div");
    userLabel.textContent = strings.userField;
    userLabel.style.fontSize = "1.1rem";
    userLabel.style.marginTop = "1rem";
    userLabel.style.marginBottom = "0.3rem";
    rulesDiv.appendChild(userLabel);

    const userSelect = document.createElement("select");
    userSelect.id = "userDropdown";

    const placeholderUser = document.createElement("option");
    placeholderUser.textContent = "Select user";
    placeholderUser.disabled = true;
    placeholderUser.selected = true;
    userSelect.appendChild(placeholderUser);

    if (arrivedUsers.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No users arrived";
        option.disabled = true;
        userSelect.appendChild(option);
    } else {
        arrivedUsers.forEach(u => {
            const option = document.createElement("option");
            option.value = u.passcode;
            option.textContent = u.userName;
            userSelect.appendChild(option);
        });
    }

    styleDropdown(userSelect);
    rulesDiv.appendChild(userSelect);

    // --- Role Dropdown ---
    const roleLabel = document.createElement("div");
    roleLabel.textContent = strings.identityField;
    roleLabel.style.fontSize = "1.1rem";
    roleLabel.style.marginTop = "1rem";
    roleLabel.style.marginBottom = "0.3rem";
    rulesDiv.appendChild(roleLabel);

    const roleSelect = document.createElement("select");
    roleSelect.id = "roleDropdown";

    const placeholderRole = document.createElement("option");
    placeholderRole.textContent = "Select role";
    placeholderRole.disabled = true;
    placeholderRole.selected = true;
    roleSelect.appendChild(placeholderRole);

    if (rolesArray.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No roles available";
        option.disabled = true;
        roleSelect.appendChild(option);
    } else {
        rolesArray.forEach(r => {
            const option = document.createElement("option");
            option.value = r.passcode;
            option.textContent = userLang === "it" ? r.roleIt : r.roleEn;
            roleSelect.appendChild(option);
        });
    }

    styleDropdown(roleSelect);
    rulesDiv.appendChild(roleSelect);
}

// --- Helper function to style dropdowns ---
function styleDropdown(select) {
    select.style.fontFamily = "monospace";
    select.style.fontSize = "1rem";
    select.style.padding = "0.5rem 1rem";
    select.style.marginBottom = "1rem";
    select.style.backgroundColor = "rgba(0,0,0,0.9)";
    select.style.color = "rgba(255,255,255,0.9)";
    select.style.border = "none";
    select.style.borderRadius = "4px";
    select.style.cursor = "pointer";
    select.style.minWidth = "250px";
    select.style.transition = "background-color 0.2s";

    // Hover / focus effect
    select.onmouseover = () => select.style.backgroundColor = "rgba(50,50,50,0.9)";
    select.onmouseout = () => select.style.backgroundColor = "rgba(0,0,0,0.9)";
    select.onfocus = () => select.style.outline = "2px solid rgba(255,255,255,0.7)";
    select.onblur = () => select.style.outline = "none";
}

init();
