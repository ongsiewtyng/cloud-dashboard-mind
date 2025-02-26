// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCodsiUC1u0d3cecQkndoKYh6pMWBF1ZPE",
    authDomain: "mcm-dashboard-97482.firebaseapp.com",
    projectId: "mcm-dashboard-97482",
    storageBucket: "mcm-dashboard-97482.firebasestorage.app",
    messagingSenderId: "712229552892",
    appId: "1:712229552892:web:673df0a0fdecfb88c38d79",
    measurementId: "G-V5ZSL12GSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app); // ✅ Export the database correctly
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, ref };