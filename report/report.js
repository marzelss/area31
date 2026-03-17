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

    // --- Get all users from entries/userOptions ---
    const arrivedUsers = await getArrivedUsers();
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);

    // --- Empty state: no users arrived at all ---
    if (filteredUsers.length === 0) {
        // check if past 26 Mar 21:30
        const now = new Date();
        const cutoff = new Date('2026-03-26T21:30:00'); // adjust year as needed
        const label = document.createElement("div");

        if (now >= cutoff) {
            label.textContent = strings.noMoreEntries;
        } else {
            label.textContent = strings.emptyState;
        }

        label.style.fontSize = "1.1rem";
        label.style.marginTop = "1rem";
        rulesDiv.appendChild(label);
        return; // stop here, no dropdowns
    }

    // --- Add top dropdown ---
    addDropdown(rulesDiv, strings.userField, filteredUsers.map(u => ({ value: u.passcode, text: u.userName })));

    // --- Roles Dropdown ---
    const rolesOptions = await getRolesOptions();

    // Get current user's role name for this locale
    const currentUserRoleSnapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    const currentUserRoleName = currentUserRoleSnapshot.exists() ? currentUserRoleSnapshot.val() : null;

    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);

    addDropdown(rulesDiv, strings.identityField, filteredRoles.map(r => ({ value: r.it + "|" + r.en, text: userLang === "it" ? r.it : r.en })));

    // --- Submit Button ---
    const submitBtn = document.createElement("button");
    submitBtn.textContent = strings.submitButton;
    submitBtn.style.fontFamily = "monospace";
    submitBtn.style.fontSize = "1rem";
    submitBtn.style.padding = "0.5rem 1rem";
    submitBtn.style.marginTop = "1rem";
    submitBtn.style.marginBottom = "0.5rem";
    submitBtn.style.marginTop = "1rem";
    submitBtn.style.backgroundColor = "rgba(0,0,0,0.9)";
    submitBtn.style.color = "rgba(255,255,255,0.9)";
    submitBtn.style.border = "none";
    submitBtn.style.borderRadius = "4px";
    submitBtn.style.cursor = "pointer";
    submitBtn.style.display = "none"; // hidden initially
    
    rulesDiv.appendChild(submitBtn);
    
    // --- Get dropdowns ---
    const dropdowns = rulesDiv.querySelectorAll("select");
    const userDropdown = dropdowns[0];
    const roleDropdown = dropdowns[1];
    
    // --- Show button only when both dropdowns have values ---
    function checkSelections() {
        if (userDropdown.value && roleDropdown.value) {
            submitBtn.style.display = "block";
        } else {
            submitBtn.style.display = "none";
        }
    }
    
    userDropdown.addEventListener("change", checkSelections);
    roleDropdown.addEventListener("change", checkSelections);

    submitBtn.onclick = () => {
        const selectedUser = userDropdown.value;
        const selectedRole = roleDropdown.value;
    
        console.log(selectedUser, selectedRole);
    };
}

// --- Fetch all users from entries/userOptions ---
async function getArrivedUsers() {
    const snapshot = await get(ref(db, `${passcode}/entries/userOptions`));

    if (!snapshot.exists()) {
        return [];
    }

    const userOptions = snapshot.val();

    const usersArray = Object.values(userOptions).map(entry => ({
        passcode: entry.passcode,
        userName: entry["real-name"]
    }));

    return usersArray;
}

// --- Fetch rolesOptions from current user's entries, or create them if they don't exist ---
async function getRolesOptions() {
    const rolesRef = ref(db, `${passcode}/entries/rolesOptions`);
    const snapshot = await get(rolesRef);

    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        // Build array from all users in database
        const allSnapshot = await get(ref(db, "/"));
        const allUsers = allSnapshot.exists() ? allSnapshot.val() : {};

        const rolesArray = [];
        Object.values(allUsers).forEach(userData => {
            if (userData.role) {
                rolesArray.push({ it: userData.role.it.name, en: userData.role.en.name });
            }
        });

        // Save it to rolesOptions for current user
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
    const placeholder = document.createElement("option");
    placeholder.textContent = "Select...";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    optionsArray.forEach(o => {
        const option = document.createElement("option");
        option.value = o.value;
        option.textContent = o.text;
        select.appendChild(option);
    });

    styleDropdown(select);
    parentDiv.appendChild(select);
}

// --- Styling function ---
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
