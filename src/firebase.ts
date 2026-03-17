// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzOehZykTrdgDpHDq6v9m7Qm7GQf5IuSg",
  authDomain: "outpostdigitalsolutions.firebaseapp.com",
  projectId: "outpostdigitalsolutions",
  storageBucket: "outpostdigitalsolutions.firebasestorage.app",
  messagingSenderId: "3015430856",
  appId: "1:3015430856:web:4d1d26b6e0d43f0d530bfd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
