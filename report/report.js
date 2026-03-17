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

    setupTitle();
    setupExplanation(strings);
    setupRules(strings);

    const arrivedUsers = await getArrivedUsers();
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);

    const anyArrived = await anyGuestsArrived();

    if (filteredUsers.length === 0) {
        handleEmptyState(filteredUsers, anyArrived, strings);
        return;
    }

    const userDropdown = addUserDropdown(filteredUsers, strings.userField);
    const roleDropdown = await addRoleDropdown(strings.identityField);

    const submitBtn = createSubmitButton(strings.submitButton);
    rulesDiv.appendChild(submitBtn);

    setupDropdownListeners(userDropdown, roleDropdown, submitBtn);
    setupSubmitButton(submitBtn, userDropdown, roleDropdown, strings);
}

// --- Section: Setup page elements ---
function setupTitle() {
    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;
}

function setupExplanation(strings) {
    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";
}

function setupRules(strings) {
    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";
}

// --- Section: Empty state handling ---
function handleEmptyState(filteredUsers, anyArrived, strings) {
    const now = new Date();
    const cutoff = new Date('2026-03-26T21:30:00'); // adjust year if needed
    const label = document.createElement("div");

    if (now >= cutoff) {
        label.textContent = strings.noMoreEntries;
    } else {
        if (anyArrived) {
            label.textContent = strings.tryAgainLater;
        } else {
            label.textContent = strings.emptyState;
        }
    }

    label.style.fontSize = "1.1rem";
    label.style.marginTop = "1rem";
    rulesDiv.appendChild(label);
}

// --- Section: Dropdowns ---
function addUserDropdown(users, labelText) {
    const dropdown = addDropdown(rulesDiv, labelText, users.map(u => ({ value: u.passcode, text: u.userName })));
    return dropdown;
}

async function addRoleDropdown(labelText) {
    const rolesOptions = await getRolesOptions();

    // Get current user's role in locale
    const currentUserRoleSnapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    const currentUserRoleName = currentUserRoleSnapshot.exists() ? currentUserRoleSnapshot.val() : null;

    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);

    const dropdown = addDropdown(
        rulesDiv,
        labelText,
        filteredRoles.map(r => ({ value: r.it + "|" + r.en, text: userLang === "it" ? r.it : r.en }))
    );

    return dropdown;
}

// --- Section: Submit button ---
function createSubmitButton(text) {
    const btn = document.createElement("button");
    btn.textContent = text;
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
    btn.style.display = "none"; // hidden initially
    return btn;
}

function setupDropdownListeners(userDropdown, roleDropdown, submitBtn) {
    function checkSelections() {
        const userSelected = userDropdown.selectedIndex > 0;
        const roleSelected = roleDropdown.selectedIndex > 0;

        submitBtn.style.display = (userSelected && roleSelected) ? "block" : "none";
    }

    userDropdown.addEventListener("change", checkSelections);
    roleDropdown.addEventListener("change", checkSelections);
}

// --- Section: Submit logic with popup ---
function setupSubmitButton(submitBtn, userDropdown, roleDropdown, strings) {
    submitBtn.onclick = () => {
        const exposedPasscode = userDropdown.value;
        const exposedUserName = userDropdown.options[userDropdown.selectedIndex].textContent;
        const selectedRoleText = roleDropdown.options[roleDropdown.selectedIndex].textContent;
        const roleIndex = roleDropdown.selectedIndex - 1;

        showConfirmationPopup(strings, async () => {
            try {
                // --- get exposed user's role ---
                const roleSnap = await get(ref(db, `${exposedPasscode}/role/${userLang}/name`));
                if (!roleSnap.exists()) {
                    console.log("Role not found for exposed user");
                    return;
                }
                const exposedRole = roleSnap.val();

                // --- check correctness ---
                if (exposedRole.toLowerCase() === selectedRoleText.toLowerCase()) {
                    // add points to current user
                    const myPointsRef = ref(db, `${passcode}/points`);
                    const myPointsSnap = await get(myPointsRef);
                    const myPoints = myPointsSnap.exists() ? myPointsSnap.val() : 0;
                    await set(myPointsRef, myPoints + 3);

                    // remove point from exposed user
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
                        it: roleDropdown.value.split("|")[0],
                        en: roleDropdown.value.split("|")[1]
                    }
                };
                await set(ref(db, `${passcode}/reports/${exposedPasscode}`), reportData);

                // --- Remove exposed user from userOptions ---
                await remove(ref(db, `${passcode}/entries/userOptions/${exposedPasscode}`));

                // --- Remove role from rolesOptions ---
                await remove(ref(db, `${passcode}/entries/rolesOptions/${roleIndex}`));

                console.log("Report stored and options cleaned");
                window.location.reload();

            } catch (error) {
                console.error("Error during report:", error);
            }
        });
    };
}

// --- Section: Custom popup helper ---
function showConfirmationPopup(strings, onConfirm) {
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

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = strings.submitButton;
    confirmBtn.style.fontFamily = "monospace";
    confirmBtn.style.padding = "0.5rem 1rem";
    confirmBtn.style.backgroundColor = "rgba(0,0,0,0.9)";
    confirmBtn.style.color = "#fff";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "4px";
    confirmBtn.style.cursor = "pointer";
    confirmBtn.onclick = async () => { await onConfirm(); popup.remove(); };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = strings.cancelButton;
    cancelBtn.style.fontFamily = "monospace";
    cancelBtn.style.padding = "0.5rem 1rem";
    cancelBtn.style.backgroundColor = "rgba(50,50,50,0.9)";
    cancelBtn.style.color = "#fff";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.cursor = "pointer";
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
