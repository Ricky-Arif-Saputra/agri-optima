import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_API_KEY_KAMU_DI_SINI",
  authDomain: "agri-optima.firebaseapp.com",
  projectId: "agri-optima",
  storageBucket: "agri-optima.firebasestorage.app",
  messagingSenderId: "PASTE_SENDER_ID_DI_SINI",
  appId: "PASTE_APP_ID_DI_SINI"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);