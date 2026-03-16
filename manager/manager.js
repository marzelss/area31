import { db } from "../sources/firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const contentDiv = document.getElementById("content");
const unauthorizedDiv = document.getElementById("unauthorized");

// Get passcode from session storage
const passcode = sessionStorage.getItem("passcode");

if (!passcode) {
    showUnauthorized();
} else {
    checkMartina(passcode);
}

async function checkMartina(passcode) {
    try {
        const dbRef = ref(db);
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
            showUnauthorized();
            return;
        }

        const data = snapshot.val();
        let matchedCode = null;

        // Find the object with real-name "Martina"
        for (const [code, obj] of Object.entries(data)) {
            if (obj["real-name"] === "Martina") {
                matchedCode = code;
                break;
            }
        }

        // Check if the matched code equals session storage passcode
        if (matchedCode && matchedCode === passcode) {
            contentDiv.style.display = "block";
        } else {
            showUnauthorized();
        }

    } catch (err) {
        console.error("Error reading from Firebase:", err);
        showUnauthorized();
    }
}

function showUnauthorized() {
    unauthorizedDiv.style.display = "block";
}
