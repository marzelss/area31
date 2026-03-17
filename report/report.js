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

    // --- These elements are always present ---
    setupTitle();
    setupExplanation(strings);
    setupRules(strings);

    // --- Get all users from entries/userOptions ---
    const arrivedUsers = await getArrivedUsers();
    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);

    // --- Handle empty state if too early, no more entries, or party over ---
    if (filteredUsers.length === 0) {
        
        // check if past 26 Mar 21:45
        const now = new Date();
        const cutoff = new Date('2026-03-26T21:45:00');

        // create empty state label
        const label = document.createElement("div");

        // check if party started and any guests arrived
        const anyArrived = await anyGuestsArrived();

        // show game ended label if party over
        if (now >= cutoff) {
            label.textContent = strings.noMoreEntries;
        // else handle empty state
        } else {
            // party has started
            if (anyArrived) {
                label.textContent = strings.tryAgainLater;
            // party yet to start
            } else {
                label.textContent = strings.emptyState;
            }
        }

        label.style.fontSize = "1.1rem";
        label.style.marginTop = "1rem";
        rulesDiv.appendChild(label);
        
        // stop here, no dropdowns
        return;
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

    submitBtn.onclick = () => {
    
        const exposedPasscode = userDropdown.value;
        const exposedUserName = userDropdown.options[userDropdown.selectedIndex].textContent;
        const selectedRoleText = roleDropdown.options[roleDropdown.selectedIndex].textContent;
        const roleIndex = roleDropdown.selectedIndex - 1; // because index 0 is placeholder
    
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
        popup.style.padding = "1.5rem"
    
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
        confirmBtn.style.fontFamily = "monospace";
        confirmBtn.style.padding = "0.5rem 1rem";
        confirmBtn.style.backgroundColor = "rgba(0,0,0,0.9)";
        confirmBtn.style.color = "#fff";
        confirmBtn.style.border = "none";
        confirmBtn.style.borderRadius = "4px";
        confirmBtn.style.cursor = "pointer";
    
        confirmBtn.onclick = async () => {
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
    
            popup.remove();
            // Optionally reload page if you want UI refreshed:
            // window.location.reload();
        };
    
        // --- Cancel Button ---
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
    };
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
