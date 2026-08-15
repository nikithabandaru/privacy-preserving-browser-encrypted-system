import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeGf0sXKaB-km9X9PeALt1ch1YfGfP67E",
  authDomain: "ai-digital-9a2fe.firebaseapp.com",
  projectId: "ai-digital-9a2fe",
  storageBucket: "ai-digital-9a2fe.firebasestorage.app",
  messagingSenderId: "22499305729",
  appId: "1:22499305729:web:a079b8722106cf5b735300"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
