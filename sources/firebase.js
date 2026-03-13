// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_I_7YGhqBAAeEMpJI2ZiZ9tnCfa9myEw",
    authDomain: "area31-922e5.firebaseapp.com",
    projectId: "area31-922e5",
    storageBucket: "area31-922e5.firebasestorage.app",
    messagingSenderId: "330214881157",
    appId: "1:330214881157:web:8492f1995cc5ba25d9f6ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export storage so other scripts can use it
export const storage = getStorage(app);
