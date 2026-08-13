import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0nN9LYhqmY--jzwbHBo7Uq5mdFpYq57w",
  authDomain: "policia-dias.firebaseapp.com",
  projectId: "policia-dias",
  storageBucket: "policia-dias.firebasestorage.app",
  messagingSenderId: "497323845198",
  appId: "1:497323845198:web:6f124974138c3b758ec51f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
