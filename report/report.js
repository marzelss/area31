import { db } from "../sources/firebase.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { loadLocale } from "../utils/i18n.js";

const terminal = document.getElementById("terminal");
const explanationDiv = document.getElementById("explanation");
const rulesDiv = document.getElementById("rules");

const passcode = sessionStorage.getItem("passcode");
const userLang = navigator.language.startsWith("it") ? "it" : "en";

async function init() {
    const strings = await loadLocale("report");

    terminal.innerHTML = `<strong style="font-size: 1.5rem;">REPORT</strong>`;

    explanationDiv.textContent = strings.explanation;
    explanationDiv.style.fontSize = "1.2rem";
    explanationDiv.style.marginTop = "1rem";
    explanationDiv.style.marginBottom = "1rem";

    rulesDiv.textContent = strings.rules;
    rulesDiv.style.fontSize = "1rem";
    rulesDiv.style.color = "#333";
    rulesDiv.style.marginBottom = "1rem";

    /* -----------------------------
       NEW: check if anyone arrived
    ----------------------------- */

    const globalSnapshot = await get(ref(db, "/"));
    const users = globalSnapshot.exists() ? globalSnapshot.val() : {};

    const someoneArrived = Object.values(users).some(u => u.arrived === true);

    if (!someoneArrived) {
        addLabel(strings.emptyState);
        return;
    }

    /* -----------------------------
       Load arrivedUsers from entries
    ----------------------------- */

    const arrivedUsers = await getArrivedUsers();

    /* -----------------------------
       NEW: time gate
    ----------------------------- */

    if (arrivedUsers.length === 0) {

        const cutoff = new Date(2026, 2, 26, 21, 30); // 26 March 21:30
        const now = new Date();

        if (now >= cutoff) {
            addLabel(strings.noMoreEntries);
            return;
        }
    }

    const filteredUsers = arrivedUsers.filter(u => u.passcode !== passcode);

    addDropdown(
        rulesDiv,
        strings.userField,
        filteredUsers.map(u => ({ value: u.passcode, text: u.userName }))
    );

    const rolesOptions = await getRolesOptions();

    const currentUserRoleSnapshot = await get(ref(db, `${passcode}/role/${userLang}/name`));
    const currentUserRoleName = currentUserRoleSnapshot.exists()
        ? currentUserRoleSnapshot.val()
        : null;

    const filteredRoles = rolesOptions.filter(r => r[userLang] !== currentUserRoleName);

    addDropdown(
        rulesDiv,
        strings.identityField,
        filteredRoles.map(r => ({
            value: r.it + "|" + r.en,
            text: userLang === "it" ? r.it : r.en
        }))
    );
}

/* -----------------------------
   CHANGED: load from entries
----------------------------- */

async function getArrivedUsers() {

    const snapshot = await get(ref(db, `${passcode}/entries/userOptions`));

    if (!snapshot.exists()) return [];

    return snapshot.val();
}

/* -----------------------------
   Roles options logic
----------------------------- */

async function getRolesOptions() {

    const rolesRef = ref(db, `${passcode}/entries/rolesOptions`);
    const snapshot = await get(rolesRef);

    if (snapshot.exists()) {
        return snapshot.val();
    }

    const allSnapshot = await get(ref(db, "/"));
    const allUsers = allSnapshot.exists() ? allSnapshot.val() : {};

    const rolesArray = [];

    Object.values(allUsers).forEach(userData => {
        if (userData.role) {
            rolesArray.push({
                it: userData.role.it.name,
                en: userData.role.en.name
            });
        }
    });

    /* Save in Firebase-friendly array */

    await set(rolesRef, rolesArray);

    return rolesArray;
}

/* -----------------------------
   UI helpers
----------------------------- */

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

    if (optionsArray.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No users arrived";
        option.disabled = true;
        select.appendChild(option);
    } else {
        optionsArray.forEach(o => {
            const option = document.createElement("option");
            option.value = o.value;
            option.textContent = o.text;
            select.appendChild(option);
        });
    }

    styleDropdown(select);
    parentDiv.appendChild(select);
}

function addLabel(text) {

    const label = document.createElement("div");
    label.textContent = text;
    label.style.fontSize = "1.1rem";
    label.style.marginTop = "1rem";

    rulesDiv.appendChild(label);
}

/* -----------------------------
   Styling (UNCHANGED)
----------------------------- */

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
