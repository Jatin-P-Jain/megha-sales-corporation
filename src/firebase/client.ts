// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { Analytics, getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
  authDomain: "hot-homes-8a814.firebaseapp.com",
  projectId: "hot-homes-8a814",
  storageBucket: "hot-homes-8a814.firebasestorage.app",
  messagingSenderId: "555228794504",
  appId: "1:555228794504:web:82a1fdb0562869b0cc993d",
  measurementId: "G-WG1T5BKKG8",
};

// Initialize Firebase
const currentApps = getApps();
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics;
if (!currentApps.length) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
} else {
  const app = currentApps[0];
  auth = getAuth(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
}

export { auth, storage, analytics };
