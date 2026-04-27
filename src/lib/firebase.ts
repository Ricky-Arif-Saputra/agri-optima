import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ganti data di bawah ini dengan data dari Console Firebase kamu
// Jika belum punya, buat dulu di https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyxxxxxxxxxxxxxxxxxxxx",
  authDomain: "agri-optima.firebaseapp.com",
  projectId: "agri-optima",
  storageBucket: "agri-optima.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef12345"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);