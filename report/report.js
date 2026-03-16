import { db } from "../sources/firebase.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode"); // current user
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

    // --- Load arrived users from userOptions ---
    const arrivedUsers = await getArrivedUsers();

    // --- Handle empty states ---
    if (!arrivedUsers || arrivedUsers.length === 0) {
        const label = document.createElement("div");

        // check if date/time is 26 March 21:30 or past
        const cutoff = new Date("2026-03-26T21:30:00");
        const now = new Date();

        if (now >= cutoff) {
            label.textContent = strings.noMoreEntries;
        } else {
            label.textContent = strings.emptyState;
        }

        label.style.fontSize = "1.1rem";
        label.style.marginTop = "1rem";
        rulesDiv.appendChild(label);
        return; // stop here, don't add dropdowns
    }

    // --- Top dropdown: users ---
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);
    const topDropdown = addDropdown(rulesDiv, strings.userField, filteredUsers.map(u => ({ value: u.passcode, text: u.userName })));

    // --- Bottom dropdown: rolesOptions ---
    const rolesOptions = await getRolesOptions();

    // Get current user's role name for this locale
    const currentUserRoleSnapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    const currentUserRoleName = currentUserRoleSnapshot.exists() ? currentUserRoleSnapshot.val() : null;

    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);
    const bottomDropdown = addDropdown(rulesDiv, strings.identityField, filteredRoles.map(r => ({ value: r.it + "|" + r.en, text: userLang === "it" ? r.it : r.en })));

    // --- Show submit button if both dropdowns have a value ---
    if (topDropdown.value && bottomDropdown.value) {
        const submitBtn = document.createElement("button");
        submitBtn.textContent = strings.submitButton;
        submitBtn.style.marginTop = "1rem";
        submitBtn.style.alignSelf = "flex-start";
        submitBtn.style.fontFamily = "monospace";
        submitBtn.style.fontSize = "1rem";
        submitBtn.style.padding = "0.7rem 1.5rem";
        submitBtn.style.backgroundColor = "rgba(0,0,0,0.9)";
        submitBtn.style.color = "rgba(255,255,255,0.9)";
        submitBtn.style.border = "none";
        submitBtn.style.borderRadius = "4px";
        submitBtn.style.cursor = "pointer";
        submitBtn.style.transition = "background-color 0.2s";

        submitBtn.onmouseover = () => submitBtn.style.backgroundColor = "rgba(50,50,50,0.9)";
        submitBtn.onmouseout = () => submitBtn.style.backgroundColor = "rgba(0,0,0,0.9)";

        rulesDiv.appendChild(submitBtn);
    }
}

// --- Fetch arrived users from current user's entries ---
async function getArrivedUsers() {
    const snapshot = await get(ref(db, `${passcode}/entries/userOptions`));
    return snapshot.exists() ? snapshot.val() : [];
}

// --- Fetch rolesOptions from current user's entries, or create them if they don't exist ---
async function getRolesOptions() {
    const rolesRef = ref(db, `${passcode}/entries/rolesOptions`);
    const snapshot = await get(rolesRef);

    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        const allSnapshot = await get(ref(db, "/"));
        const allUsers = allSnapshot.exists() ? allSnapshot.val() : {};

        const rolesArray = [];
        Object.values(allUsers).forEach(userData => {
            if (userData.role) {
                rolesArray.push({ it: userData.role.it.name, en: userData.role.en.name });
            }
        });

        await set(rolesRef, rolesArray);
        return rolesArray;
    }
}

// --- Helper to add a dropdown with label ---
function addDropdown(parentDiv, labelText, optionsArray) {
    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.fontSize = "1.1rem";
    label.style.marginTop = "1rem";
    label.style.marginBottom = "0.3rem";
    parentDiv.appendChild(label);

    const select = document.createElement("select");
    optionsArray.forEach((o, index) => {
        const option = document.createElement("option");
        option.value = o.value;
        option.textContent = o.text;
        if (index === 0) option.selected = true; // preselect first option
        select.appendChild(option);
    });

    styleDropdown(select);
    parentDiv.appendChild(select);
    return select;
}

// --- Styling ---
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

    select.onmouseover = () => select.style.backgroundColor = "rgba(50,50,50,0.9)";
    select.onmouseout = () => select.style.backgroundColor = "rgba(0,0,0,0.9)";
    select.onfocus = () => select.style.outline = "2px solid rgba(255,255,255,0.7)";
    select.onblur = () => select.style.outline = "none";
}

init();
