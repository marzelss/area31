import { db } from "../sources/firebase.js";
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";
import { infoLogEvent, errorLogEvent, dbLogEvent, reportLogEvent } from "../utils/analytics.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode"); // current user
const userLang = navigator.language.startsWith("it") ? "it" : "en";

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
    infoLogEvent("User selected button: FILE REPORT");
    const strings = await loadLocale("report");

    // --- These elements are always present ---
    addBackButton(strings);
    setupTitle();
    setupExplanation(strings);
    setupRules(strings);

    // --- Get all users from entries/userOptions ---
    const arrivedUsers = await getArrivedUsers();
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);

    // --- Handle empty state if too early, no more entries, or party over ---
    if (filteredUsers.length === 0) {
        // handle empty state
        handleEmptyState(strings)
        // --- History link ---
        await addHistoryLink(strings);
        // stop here, no dropdowns
        return;
    }

    // --- History link ---
    await addHistoryLink(strings);

    // --- Users dropdown ---
    addDropdown(rulesDiv, strings.userField, filteredUsers.map(u => ({ value: u.passcode, text: u.userName })), true);

    // --- Roles Dropdown ---
    const rolesOptions = await getRolesOptions();
    const currentUserRoleSnapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    const currentUserRoleName = currentUserRoleSnapshot.exists() ? currentUserRoleSnapshot.val() : null;
    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);
    addDropdown(rulesDiv, strings.identityField, filteredRoles.map(r => ({ value: r.it + "|" + r.en, text: userLang === "it" ? r.it : r.en })), false);

    // --- Submit Button ---
    const submitBtn = createSubmitButton(strings);
    rulesDiv.appendChild(submitBtn);
    
    // --- Get dropdowns ---
    const dropdowns = rulesDiv.querySelectorAll("select");
    const userDropdown = dropdowns[0];
    const roleDropdown = dropdowns[1];
    
    // --- Show button only when both dropdowns have values ---
    function checkSelections() {
        const userSelected = userDropdown.selectedIndex > 0;
        const roleSelected = roleDropdown.selectedIndex > 0;
    
        if (userSelected && roleSelected) {
            submitBtn.style.display = "block";
        } else {
            submitBtn.style.display = "none";
        }
    }
    
    userDropdown.addEventListener("change", checkSelections);
    roleDropdown.addEventListener("change", checkSelections);

    submitBtn.onclick = () => handleSubmit(userDropdown, roleDropdown, strings);
}

// ------------
// ---- UI ----
// ------------

// --- BACK BUTTON ---
function addBackButton(strings) {
    const backBtn = document.createElement("div");
    backBtn.textContent = strings.backButton;
    backBtn.style.fontFamily = "monospace";
    backBtn.style.fontSize = "1.1rem";
    backBtn.style.cursor = "pointer";
    backBtn.style.textDecoration = "underline";
    backBtn.style.marginTop = "1rem";
    backBtn.style.marginBottom = "1rem";
    backBtn.onclick = () => {
        window.history.back();
    };
    document.body.appendChild(backBtn);
}

// --- TITLE ---
function setupTitle() {
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;
}

// --- EXPLANATION ---
function setupExplanation(strings) {
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";
}

// --- RULES ---
function setupRules(strings) {
    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";
}

// --- EMPTY STATE ---
async function handleEmptyState(strings) {
    
    // create conditions
    const now = new Date();
    const cutoff = new Date('2026-03-16T21:45:00');
    const anyArrived = await anyGuestsArrived();

    // create empty state label
    const label = document.createElement("div");
    
    // show game ended label if party over
    if (now >= cutoff) {
        infoLogEvent("User selected button: FILE REPORT: Empty state: Party is over");
        label.textContent = strings.noMoreEntries;
    // else handle empty state
    } else {
        // party has started
        if (anyArrived) {
            infoLogEvent("User selected button: FILE REPORT: Empty state: No entries available");
            label.textContent = strings.tryAgainLater;
        // party yet to start
        } else {
            infoLogEvent("User selected button: FILE REPORT: Empty state: Party is yet to start");
            label.textContent = strings.emptyState;
        }
    }

    // set up empty state
    label.style.fontSize = "1.1rem";
    label.style.marginTop = "1rem";
    rulesDiv.appendChild(label);
}

// --- VIEW HISTORY LINK ---
async function addHistoryLink(strings) {

    const reportsSnap = await get(ref(db, `${passcode}/reports`));

    // nothing to show
    if (!reportsSnap.exists()) return;

    const historyLink = document.createElement("div");
    historyLink.textContent = strings.viewHistory;

    historyLink.style.fontFamily = "monospace";
    historyLink.style.fontWeight = "bold";
    historyLink.style.cursor = "pointer";
    historyLink.style.marginTop = "1rem";
    historyLink.style.marginBottom = "1rem";
    historyLink.style.textDecoration = "underline";

    historyLink.onclick = () => {
        infoLogEvent("User selected button: FILE REPORT HISTORY");
        window.location.href = "../history/history.html";
    };

    rulesDiv.appendChild(historyLink);
}

// --- SUBMIT BUTTON ---
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

// --- CUSTOM POPUP ---
function setupPopup() {
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
    return popup;
}

function setupPopupMessage(strings) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = strings.warningMessage;
    messageDiv.style.fontSize = "1.2rem";
    messageDiv.style.marginBottom = "1.5rem";
    return messageDiv;
}

function setupPopupButtons() {
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "1rem";
    return buttonsDiv;
}

function setupConfirmButton(strings) {
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = strings.submitButton;
    confirmBtn.style.fontFamily = "monospace";
    confirmBtn.style.padding = "0.5rem 1rem";
    confirmBtn.style.backgroundColor = "rgba(0,0,0,0.9)";
    confirmBtn.style.color = "#fff";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "4px";
    confirmBtn.style.cursor = "pointer";
    return confirmBtn;
}

function setupCancelButton(strings) {
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = strings.cancelButton;
    cancelBtn.style.fontFamily = "monospace";
    cancelBtn.style.padding = "0.5rem 1rem";
    cancelBtn.style.backgroundColor = "rgba(50,50,50,0.9)";
    cancelBtn.style.color = "#fff";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.cursor = "pointer";
    return cancelBtn;
}

// ------------
// ---- UX ----
// ------------

// --- Handle submission ---

function handleSubmit(userDropdown, roleDropdown, strings) {
    
        const exposedPasscode = userDropdown.value;
        const exposedUserName = userDropdown.options[userDropdown.selectedIndex].textContent;
        const selectedRoleText = roleDropdown.options[roleDropdown.selectedIndex].textContent;
        const roleIndex = roleDropdown.selectedIndex - 1; // index 0 is placeholder
        infoLogEvent(`User selected button: FILE REPORT SUBMIT: user ${exposedUserName}: role ${selectedRoleText}`);
    
        // --- Custom confirmation popup ---
        const popup = setupPopup();
        const messageDiv = setupPopupMessage(strings);
        const buttonsDiv = setupPopupButtons();
        const confirmBtn = setupConfirmButton(strings);
    
        confirmBtn.onclick = async () => {
            reportLogEvent(`User selected button: FILE REPORT SUBMIT: user ${exposedUserName}: role ${selectedRoleText}: CONFIRM`);

            try {
                // --- get exposed user's role ---
                const roleSnap = await get(ref(db, `${exposedPasscode}/role/${userLang}/name`));
                if (!roleSnap.exists()) {
                    console.log("Role not found for exposed user");
                    popup.remove();
                    return;
                }
                const exposedRole = roleSnap.val();
    
                // --- check correctness ---
                if (exposedRole.toLowerCase() === selectedRoleText.toLowerCase()) {
                    infoLogEvent(`User selected button: FILE REPORT SUBMIT: correct`);
                    // add points to current user
                    const myPointsRef = ref(db, `${passcode}/points`);
                    const myPointsSnap = await get(myPointsRef);
                    const myPoints = myPointsSnap.exists() ? myPointsSnap.val() : 0;
                    await set(myPointsRef, myPoints + 3);
                    dbLogEvent(`User won 3 points: total ${myPoints + 3}`);
    
                    // remove point from exposed user
                    const exposedPointsRef = ref(db, `${exposedPasscode}/points`);
                    const exposedPointsSnap = await get(exposedPointsRef);
                    const exposedPoints = exposedPointsSnap.exists() ? exposedPointsSnap.val() : 0;
                    await set(exposedPointsRef, exposedPoints - 1);
                    dbLogEvent(`Exposed user lost 1 point`);

                    // --- Update "hasExposed" for current user ---
                    const hasExposedRef = ref(db, `${passcode}/hasExposed`);
                    const hasExposedSnap = await get(hasExposedRef);
                    const hasExposed = hasExposedSnap.exists() ? hasExposedSnap.val() : 0;
                    await set(hasExposedRef, hasExposed + 1);
                    dbLogEvent(`Update user hasExposed number: total ${hasExposed + 1}`);
                    
                    // --- Update "wasExposed" for exposed user ---
                    const wasExposedRef = ref(db, `${exposedPasscode}/wasExposed`);
                    const wasExposedSnap = await get(wasExposedRef);
                    const wasExposed = wasExposedSnap.exists() ? wasExposedSnap.val() : 0;
                    await set(wasExposedRef, wasExposed + 1);
                    dbLogEvent(`Update user wasExposed number`);
                    
                } else {
                    infoLogEvent(`User selected button: FILE REPORT SUBMIT: not correct`);
                }
    
                // --- Save report ---
                const reportData = {
                    name: exposedUserName,
                    role: {
                        it: roleDropdown.value.split("|")[0],
                        en: roleDropdown.value.split("|")[1]
                    }
                };
                await set(ref(db, `${passcode}/reports/${exposedPasscode}`), reportData);
                dbLogEvent("Added report to user");
                
                // --- Remove exposed user from userOptions ---
                await remove(ref(db, `${passcode}/entries/userOptions/${exposedPasscode}`));
                dbLogEvent("Removed exposed user from userOptions");
    
                // --- Remove role from rolesOptions ---
                await remove(ref(db, `${passcode}/entries/rolesOptions/${roleIndex}`));
                dbLogEvent("Removed exposed role from rolesOptions");
    
                window.location.reload();
                
            } catch (error) {
                errorLogEvent(`User selected button: FILE REPORT SUBMIT: CONFIRM: error`);
                
                console.error("Error during report:", error);
            }
    
            popup.remove();
        };
    
        // --- Cancel Button ---
        const cancelBtn = setupCancelButton(strings);
    
        cancelBtn.onclick = () => popup.remove();
    
        buttonsDiv.appendChild(confirmBtn);
        buttonsDiv.appendChild(cancelBtn);
    
        popup.appendChild(messageDiv);
        popup.appendChild(buttonsDiv);
        document.body.appendChild(popup);
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

// --- Helper to add a dropdown with optional shuffle ---
function addDropdown(parentDiv, labelText, optionsArray, shuffle = false) {
    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.fontSize = "1.1rem";
    label.style.marginTop = "1rem";
    label.style.marginBottom = "0.3rem";
    parentDiv.appendChild(label);

    const select = document.createElement("select");

    // Add placeholder
    const placeholder = document.createElement("option");
    placeholder.textContent = "Select...";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // Optionally shuffle
    let finalOptions = optionsArray.slice(); // copy array
    if (shuffle) {
        for (let i = finalOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalOptions[i], finalOptions[j]] = [finalOptions[j], finalOptions[i]];
        }
    }

    // Add options to dropdown
    finalOptions.forEach(o => {
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
