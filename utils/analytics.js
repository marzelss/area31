import { db } from "../sources/firebase.js";
import { ref, push } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

/**
 * Log an analytics event for the current user
 * @param {string} message - Custom string describing the event
 * @param {Object} data - Optional dictionary of key/value pairs (all strings)
 */
export async function logEvent(message, data = {}) {
    try {
        const passcode = sessionStorage.getItem("passcode");
        if (!passcode) return;

        const event = {
            timestamp: Date.now(),
            message: message,
            data: data
        };

        await push(ref(db, `${passcode}/analytics`), event);

    } catch (err) {
        console.error("Analytics error:", err);
    }
}
