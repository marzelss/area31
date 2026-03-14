// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_I_7YGhqBAAeEMpJI2ZiZ9tnCfa9myEw",
  authDomain: "area31-922e5.firebaseapp.com",
  projectId: "area31-922e5",
  storageBucket: "area31-922e5.firebasestorage.app",
  messagingSenderId: "330214881157",
  appId: "1:330214881157:web:8492f1995cc5ba25d9f6ec",
  databaseURL: "https://area31-922e5-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
