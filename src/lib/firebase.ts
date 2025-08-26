import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  "projectId": "aeonai-assistant",
  "appId": "1:617606571803:web:eed818d1c09e029e8cd5be",
  "storageBucket": "aeonai-assistant.firebasestorage.app",
  "apiKey": "AIzaSyDe28YFGSPtNcC3Cz6Jwv7ljNS64fe4xZ0",
  "authDomain": "aeonai-assistant.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "617606571803"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth, provider };
