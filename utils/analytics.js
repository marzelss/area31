// utils/analytics.js
import { db } from "../sources/firebase.js"; // go up one level from utils/
import { ref, push } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

function formatTimestamp(ts) {
    const date = new Date(ts);
    return date.toLocaleString(); // full readable timestamp according to user's locale
}

/**
 * Logs an event to the database.
 * @param {"info"|"error"|"db"} type - Type of log for emoji/prefix
 * @param {string} message - Custom message
 * @param {object} data - Optional dictionary
 */
export async function infoLogEvent(message, data = {}) {
    try {
        const passcode = sessionStorage.getItem("passcode");
        if (!passcode) return;

        // Determine prefix based on type
        let prefix = "✅ Info - ";
        const timestamp = Date.now();
        const fullMessage = `${prefix}${formatTimestamp(timestamp)}\n${message}`;

        const event = {
            timestamp: timestamp,
            message: fullMessage,
            data: data
        };

        await push(ref(db, `${passcode}/analytics`), event);

    } catch (err) {
        console.error("Analytics error:", err);
    }
}


/**
 * Logs an event to the database.
 * @param {"info"|"error"|"db"} type - Type of log for emoji/prefix
 * @param {string} message - Custom message
 * @param {object} data - Optional dictionary
 */
export async function errorLogEvent(message, data = {}) {
    try {
        const passcode = sessionStorage.getItem("passcode");
        if (!passcode) return;

        // Determine prefix based on type
        let prefix = "❌ Error - ";
        const timestamp = Date.now();
        const fullMessage = `${prefix}${formatTimestamp(timestamp)}\n${message}`;

        const event = {
            timestamp: timestamp,
            message: fullMessage,
            data: data
        };

        await push(ref(db, `${passcode}/analytics`), event);

    } catch (err) {
        console.error("Analytics error:", err);
    }
}


/**
 * Logs an event to the database.
 * @param {"info"|"error"|"db"} type - Type of log for emoji/prefix
 * @param {string} message - Custom message
 * @param {object} data - Optional dictionary
 */
export async function dbLogEvent(message, data = {}) {
    try {
        const passcode = sessionStorage.getItem("passcode");
        if (!passcode) return;

        // Determine prefix based on type
        let prefix = "➡️ Database - ";
        const timestamp = Date.now();
        const fullMessage = `${prefix}${formatTimestamp(timestamp)}\n${message}`;

        const event = {
            timestamp: timestamp,
            message: fullMessage,
            data: data
        };

        await push(ref(db, `${passcode}/analytics`), event);

    } catch (err) {
        console.error("Analytics error:", err);
    }
}
