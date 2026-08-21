import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCd5r7S6bNeYSequqcrBQmxXwRZxl9rORk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kharsan-properties.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kharsan-properties",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kharsan-properties.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "688850273096",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:688850273096:web:80da23d57e81aadf66a97d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
