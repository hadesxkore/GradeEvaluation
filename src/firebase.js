// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAwUWh8BHKxHg11kDk4dFmQ9hxykjJtIc",
  authDomain: "gradeeval.firebaseapp.com",
  projectId: "gradeeval",
  storageBucket: "gradeeval.appspot.com",
  messagingSenderId: "765455318793",
  appId: "1:765455318793:web:b49db1747c942f092fddd8",
  measurementId: "G-B7JKHE7T0C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db };
