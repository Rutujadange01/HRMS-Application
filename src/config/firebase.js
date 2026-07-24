import './polyfill';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your actual Firebase project config credentials
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCDrlpwsgZw783NXvfwLUFFKgXwhjuSPWw",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "hrmsapp-ba93d.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "hrmsapp-ba93d",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "hrmsapp-ba93d.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "388754253779",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:388754253779:web:54a80b491a530b050b3126",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CP5YZKV4SW"
};

let app;
let auth = null;
let db = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (appErr) {
  console.error("❌ Firebase App Init Error:", appErr.message);
}

// 1. Initialize Firestore (Independent Block)
try {
  if (app) {
    db = getFirestore(app);
    console.log("🔥 [FIREBASE SUCCESS] Cloud Firestore 'db' connected successfully!");
  }
} catch (dbErr) {
  console.error("❌ Cloud Firestore Init Error:", dbErr.message);
}

// 2. Initialize Auth (Independent Block with fallback)
try {
  if (app) {
    try {
      auth = getAuth(app);
    } catch (aErr) {
      try {
        const storage = AsyncStorage.default || AsyncStorage;
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(storage),
        });
      } catch (gErr) {
        auth = null;
      }
    }
  }
} catch (authErr) {
  auth = null;
}

export { app, auth, db, firebaseConfig };
