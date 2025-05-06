// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  connectAuthEmulator,
} from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
  authDomain: "megha-sales-corporation.firebaseapp.com",
  projectId: "megha-sales-corporation",
  storageBucket: "megha-sales-corporation.firebasestorage.app",
  messagingSenderId: "279587746987",
  appId: "1:279587746987:web:f3142e3ae123d4cc5d33ee",
  measurementId: "G-VLHND3DPSR",
};

// Initialize Firebase
const currentApps = getApps();
let auth: Auth;
let storage: FirebaseStorage;
if (!currentApps.length) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
} else {
  const app = currentApps[0];
  auth = getAuth(app);
  storage = getStorage(app);
}
// if (process.env.NODE_ENV === "development") {
//   connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
// }

export { auth, storage, RecaptchaVerifier };
