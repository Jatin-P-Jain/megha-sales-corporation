// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, RecaptchaVerifier } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { Firestore, getFirestore } from "firebase/firestore";

type FirebaseClientEnv = {
  NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSANGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
};

const getRequiredFirebaseClientEnv = () => {
  const required: Record<keyof FirebaseClientEnv, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
    NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSANGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSANGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase client environment variables: ${missing.join(", ")}`
    );
  }

  return required as FirebaseClientEnv;
};

const firebaseEnv = getRequiredFirebaseClientEnv();

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: firebaseEnv.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
  authDomain: firebaseEnv.NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN,
  projectId: firebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.NEXT_PUBLIC_FIREBASE_MESSANGING_SENDER_ID,
  appId: firebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: firebaseEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const currentApps = getApps();
let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let firestore: Firestore;
if (!currentApps.length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  firestore = getFirestore(app);
} else {
  app = currentApps[0];
  auth = getAuth(app);
  storage = getStorage(app);
  firestore = getFirestore(app);
}

export { app, auth, storage, firestore, RecaptchaVerifier };