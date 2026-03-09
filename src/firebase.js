import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDU3m_xJrvyfEqGaSziVTssLZQniiPFXh4",
  authDomain: "sabueso-2c41e.firebaseapp.com",
  projectId: "sabueso-2c41e",
  storageBucket: "sabueso-2c41e.firebasestorage.app",
  messagingSenderId: "795707761863",
  appId: "1:795707761863:web:42ba09421455c8d19d4ae2",
  measurementId: "G-92EYDL3B56"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);