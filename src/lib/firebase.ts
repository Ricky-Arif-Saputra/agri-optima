import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-yOOfG976HIdt2O9C-338W0Vf9x_V_oY",
  authDomain: "agri-optima-cf02c.firebaseapp.com",
  projectId: "agri-optima-cf02c",
  storageBucket: "agri-optima-cf02c.firebasestorage.app",
  messagingSenderId: "1001712217684",
  appId: "1:1001712217684:web:3870238865611484931a29"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;