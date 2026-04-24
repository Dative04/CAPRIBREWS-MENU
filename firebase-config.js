// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD872nPE_rH1akzVLexVWVtaNEyGSZvG1U",
  authDomain: "capibrews-menu.firebaseapp.com",
  projectId: "capibrews-menu",
  storageBucket: "capibrews-menu.firebasestorage.app",
  messagingSenderId: "492802116750",
  appId: "1:492802116750:web:185de5fbc03f477753cddf",
  measurementId: "G-7T1B0Y9RZV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);