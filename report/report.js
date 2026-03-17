import { db } from "../sources/firebase.js";
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode"); // current user
const userLang = navigator.language.startsWith("it") ? "it" : "en";

async function init() {
    const strings = await loadLocale("report");

    // Render sections that are always present
    renderTitle();
    renderExplanation(strings);
    renderRules(strings);

    // add dropdowns only if conditions allow
    const arrivedUsers = await getArrivedUsers();
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);
    const anyArrived = await anyGuestsArrived();
    if (await handleEmptyState(filteredUsers, strings, anyArrived)) return;

    // retrieve roles if not present and setup dropdowns
    const rolesOptions = await getRolesOptions();
    const currentUserRoleName = await getCurrentUserRole();
    setupDropdowns(filteredUsers, rolesOptions, currentUserRoleName, strings);
}

function renderTitle() {
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;
}

function renderExplanation(strings) {
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";
}

function renderRules(strings) {
    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";
}

// Returns true if empty state was rendered (so we should stop further execution)
async function handleEmptyState(filteredUsers, strings, anyArrived) {
    if (filteredUsers.length === 0) {
        const now = new Date();
        const cutoff = new Date('2026-03-26T21:30:00'); // adjust year if needed
        const label = document.createElement("div");

        if (now >= cutoff) {
            label.textContent = strings.noMoreEntries;
        } else if (anyArrived) {
            label.textContent = strings.tryAgainLater;
        } else {
            label.textContent = strings.emptyState;
        }

        label.style.fontSize = "1.1rem";
        label.style.marginTop = "1rem";
        rulesDiv.appendChild(label);

        return true; // stop execution
    }
    return false;
}

async function getCurrentUserRole() {
    const snapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    return snapshot.exists() ? snapshot.val() : null;
}

function setupDropdowns(filteredUsers, rolesOptions, currentUserRoleName, strings) {
    // --- User Dropdown ---
    addDropdown(rulesDiv, strings.userField, filteredUsers.map(u => ({ value: u.passcode, text: u.userName })));

    // --- Roles Dropdown ---
    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);
    addDropdown(rulesDiv, strings.identityField, filteredRoles.map(r => ({ value: r.it + "|" + r.en, text: userLang === "it" ? r.it : r.en })));

    // --- Submit Button ---
    const submitBtn = createSubmitButton(strings);
    rulesDiv.appendChild(submitBtn);

    // --- Show submit button only when both dropdowns have selection ---
    const dropdowns = rulesDiv.querySelectorAll("select");
    const userDropdown = dropdowns[0];
    const roleDropdown = dropdowns[1];

    function checkSelections() {
        submitBtn.style.display = userDropdown.selectedIndex > 0 && roleDropdown.selectedIndex > 0 ? "block" : "none";
    }
    userDropdown.addEventListener("change", checkSelections);
    roleDropdown.addEventListener("change", checkSelections);

    submitBtn.onclick = () => handleSubmit(userDropdown, roleDropdown, strings);
}

function createSubmitButton(strings) {
    const btn = document.createElement("button");
    btn.textContent = strings.submitButton;
    btn.style.fontFamily = "monospace";
    btn.style.fontSize = "1rem";
    btn.style.padding = "0.5rem 1rem";
    btn.style.marginTop = "1rem";
    btn.style.marginBottom = "0.5rem";
    btn.style.backgroundColor = "rgba(0,0,0,0.9)";
    btn.style.color = "rgba(255,255,255,0.9)";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.style.display = "none";
    return btn;
}

// Handles the custom confirmation popup and all database logic
async function handleSubmit(userDropdown, roleDropdown, strings) {
    const exposedPasscode = userDropdown.value;
    const exposedUserName = userDropdown.options[userDropdown.selectedIndex].textContent;
    const selectedRoleText = roleDropdown.options[roleDropdown.selectedIndex].textContent;
    const roleIndex = roleDropdown.selectedIndex - 1;

    // --- Custom confirmation popup ---
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.backgroundColor = "rgba(0,0,0,0.7)";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = "10000";
    popup.style.color = "#fff";
    popup.style.fontFamily = "monospace";
    popup.style.padding = "1.5rem";

    const messageDiv = document.createElement("div");
    messageDiv.textContent = strings.warningMessage;
    messageDiv.style.fontSize = "1.2rem";
    messageDiv.style.marginBottom = "1.5rem";

    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "1rem";

    // --- Confirm Button ---
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = strings.submitButton;
    Object.assign(confirmBtn.style, {
        fontFamily: "monospace",
        padding: "0.5rem 1rem",
        backgroundColor: "rgba(0,0,0,0.9)",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    });
    confirmBtn.onclick = async () => {
        await performReportLogic(exposedPasscode, exposedUserName, selectedRoleText, roleDropdown.value, roleIndex);
        popup.remove();
        window.location.reload();
    };

    // --- Cancel Button ---
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = strings.cancelButton;
    Object.assign(cancelBtn.style, {
        fontFamily: "monospace",
        padding: "0.5rem 1rem",
        backgroundColor: "rgba(50,50,50,0.9)",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    });
    cancelBtn.onclick = () => popup.remove();

    buttonsDiv.appendChild(confirmBtn);
    buttonsDiv.appendChild(cancelBtn);

    popup.appendChild(messageDiv);
    popup.appendChild(buttonsDiv);
    document.body.appendChild(popup);
}

// Handles all database logic that was inside submitBtn
async function performReportLogic(exposedPasscode, exposedUserName, selectedRoleText, roleValue, roleIndex) {
    try {
        const roleSnap = await get(ref(db, `${exposedPasscode}/role/${userLang}/name`));
        if (!roleSnap.exists()) {
            console.log("Role not found for exposed user");
            return;
        }
        const exposedRole = roleSnap.val();

        // --- check correctness ---
        if (exposedRole.toLowerCase() === selectedRoleText.toLowerCase()) {
            const myPointsRef = ref(db, `${passcode}/points`);
            const myPointsSnap = await get(myPointsRef);
            const myPoints = myPointsSnap.exists() ? myPointsSnap.val() : 0;
            await set(myPointsRef, myPoints + 3);

            const exposedPointsRef = ref(db, `${exposedPasscode}/points`);
            const exposedPointsSnap = await get(exposedPointsRef);
            const exposedPoints = exposedPointsSnap.exists() ? exposedPointsSnap.val() : 0;
            await set(exposedPointsRef, exposedPoints - 1);

            console.log("Correct report");
        } else {
            console.log("Incorrect report");
        }

        // --- Save report ---
        const reportData = {
            name: exposedUserName,
            role: {
                it: roleValue.split("|")[0],
                en: roleValue.split("|")[1]
            }
        };
        await set(ref(db, `${passcode}/reports/${exposedPasscode}`), reportData);

        // --- Remove exposed user from userOptions ---
        await remove(ref(db, `${passcode}/entries/userOptions/${exposedPasscode}`));

        // --- Remove role from rolesOptions ---
        await remove(ref(db, `${passcode}/entries/rolesOptions/${roleIndex}`));
        console.log("Report stored and options cleaned");

    } catch (error) {
        console.error("Error during report:", error);
    }
}

// --- Check if at least one guest has arrived ---
async function anyGuestsArrived() {
    const snapshot = await get(ref(db, "/")); // root or adjust path if needed
    if (!snapshot.exists()) return false;

    const allUsers = snapshot.val();
    // Check if any user has arrived === true
    return Object.values(allUsers).some(userData => userData.arrived === true);
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
