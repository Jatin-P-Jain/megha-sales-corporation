"use client";
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  Auth,
  RecaptchaVerifier,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  getAuth,
} from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { Firestore, getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSANGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const currentApps = getApps();

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let firestore: Firestore;

if (!currentApps.length) {
  app = initializeApp(firebaseConfig);

  // Recommended: set persistence at Auth initialization with fallbacks. [web:311]
  // - indexedDBLocalPersistence is best when available
  // - browserLocalPersistence falls back to localStorage
  // - browserSessionPersistence is last fallback (e.g., if storage is blocked)
  auth = initializeAuth(app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
    ],
    popupRedirectResolver: browserPopupRedirectResolver,
  });

  storage = getStorage(app);
  firestore = getFirestore(app);
} else {
  app = currentApps[0];

  // If Auth was already initialized for this app, initializeAuth will throw,
  // so we reuse the existing auth instance by calling initializeAuth in a try/catch.
  // Easiest safe approach: just call initializeAuth again in try/catch.
  try {
    auth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Fallback if already initialized elsewhere:
    auth = getAuth(app);
  }

  storage = getStorage(app);
  firestore = getFirestore(app);
}

export { app, auth, storage, firestore, RecaptchaVerifier };
