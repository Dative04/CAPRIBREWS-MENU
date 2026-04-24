// Firebase configuration for Capibrews Menu
const firebaseConfig = {
  apiKey: "AIzaSyD872nPE_rH1akzVLexVWVtaNEyGSZvG1U", // Your API Key
  authDomain: "capibrews-menu.firebaseapp.com", // Your Auth Domain
  projectId: "capibrews-menu", // Your Project ID
  storageBucket: "capibrews-menu.firebasestorage.app", // Your Storage Bucket
  messagingSenderId: "492802116750", // Your Messaging Sender ID
  appId: "1:492802116750:web:185de5fbc03f477753cddf", // Your App ID
  measurementId: "G-7T1B0Y9RZV" // Your Measurement ID
};

// Initialize Firebase using the "Compat" version
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
