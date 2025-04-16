// Your Firebase configuration
// Replace these values with the ones from your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyBEA9ZuCdJaxFFdILKS4W0IIznHkTRpu3Y",
  authDomain: "sesherz-team-generator.firebaseapp.com",
  projectId: "sesherz-team-generator",
  storageBucket: "sesherz-team-generator.firebasestorage.app",
  messagingSenderId: "1089460869279",
  appId: "1:1089460869279:web:f87f5fac22b374aae62aaa",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.log("Persistence failed: Multiple tabs open");
  } else if (err.code === "unimplemented") {
    // The browser doesn't support persistence
    console.log("Persistence not supported by this browser");
  }
});
