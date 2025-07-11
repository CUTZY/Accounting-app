// Firebase Configuration for Fung's Accounting App
const firebaseConfig = {
  apiKey: "AIzaSyBUVX7pXNFbI3izjMSks6OzuZ3GPEBiz6M",
  authDomain: "fungs-accounting.firebaseapp.com",
  projectId: "fungs-accounting",
  storageBucket: "fungs-accounting.firebasestorage.app",
  messagingSenderId: "878737167085",
  appId: "1:878737167085:web:2c05719bef6609f4b4f2e4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  console.warn('Firebase offline persistence failed:', err);
});

// Make Firebase services available globally
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log('✅ Firebase initialized with configuration');