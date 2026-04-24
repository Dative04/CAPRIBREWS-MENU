// Firebase configuration for Capibrews Menu
const firebaseConfig = {
  apiKey: "AIzaSyD872nPE_rH1akzVLexVWVtaNEyGSZvG1U",
  authDomain: "capibrews-menu.firebaseapp.com",
  projectId: "capibrews-menu",
  storageBucket: "capibrews-menu.firebasestorage.app",
  messagingSenderId: "492802116750",
  appId: "1:492802116750:web:185de5fbc03f477753cddf",
  measurementId: "G-7T1B0Y9RZV"
};

// Initialize Firebase using the "Compat" version
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
