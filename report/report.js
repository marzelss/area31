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
    let arrivedUsersRaw = await getArrivedUsers();
    let arrivedUsers = [];

    // Convert object to array of { passcode, userName } if necessary
    if (arrivedUsersRaw) {
        if (Array.isArray(arrivedUsersRaw)) {
            arrivedUsers = arrivedUsersRaw;
        } else {
            arrivedUsers = Object.entries(arrivedUsersRaw).map(([p, name]) => ({ passcode: p, userName: name }));
        }
    }

    // Filter out current user
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);

    // --- Handle empty states ---
    const now = new Date();
    const cutoff = new Date("2026-03-26T21:30:00");

    if (!arrivedUsers || arrivedUsers.length === 0 || filteredUsers.length === 0) {
        const label = document.createElement("div");
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
    const topDropdown = addDropdown(
        rulesDiv,
        strings.userField,
        filteredUsers.map(u => ({ value: u.passcode, text: u.userName })),
        "Select a user..." // placeholder
    );

    // --- Bottom dropdown: rolesOptions ---
    const rolesOptions = await getRolesOptions();

    const currentUserRoleSnapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    const currentUserRoleName = currentUserRoleSnapshot.exists() ? currentUserRoleSnapshot.val() : null;

    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);

    const bottomDropdown = addDropdown(
        rulesDiv,
        strings.identityField,
        filteredRoles.map(r => ({ value: r.it + "|" + r.en, text: userLang === "it" ? r.it : r.en })),
        "Select a role..." // placeholder
    );

    // --- Submit button under the dropdowns ---
    const submitBtn = document.createElement("button");
    submitBtn.textContent = strings.submitButton;
    submitBtn.style.marginTop = "1rem";
    styleButton(submitBtn);
    rulesDiv.appendChild(submitBtn);
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

// --- Helper to add a dropdown with label and optional placeholder ---
function addDropdown(parentDiv, labelText, optionsArray, placeholderText = null) {
    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.fontSize = "1.1rem";
    label.style.marginTop = "1rem";
    label.style.marginBottom = "0.3rem";
    parentDiv.appendChild(label);

    const select = document.createElement("select");

    // Placeholder option
    if (placeholderText) {
        const placeholder = document.createElement("option");
        placeholder.textContent = placeholderText;
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
    }

    optionsArray.forEach(o => {
        const option = document.createElement("option");
        option.value = o.value;
        option.textContent = o.text;
        select.appendChild(option);
    });

    styleDropdown(select);
    parentDiv.appendChild(select);
    return select;
}

// --- Dropdown styling ---
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

// --- Button styling ---
function styleButton(button) {
    button.style.alignSelf = "flex-start";
    button.style.fontFamily = "monospace";
    button.style.fontSize = "1rem";
    button.style.padding = "0.7rem 1.5rem";
    button.style.backgroundColor = "rgba(0,0,0,0.9)";
    button.style.color = "rgba(255,255,255,0.9)";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.cursor = "pointer";
    button.style.transition = "background-color 0.2s";

    button.onmouseover = () => button.style.backgroundColor = "rgba(50,50,50,0.9)";
    button.onmouseout = () => button.style.backgroundColor = "rgba(0,0,0,0.9)";
}

init();
