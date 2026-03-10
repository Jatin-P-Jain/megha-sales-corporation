import "server-only";
import { getApps, ServiceAccount } from "firebase-admin/app";
import admin from "firebase-admin";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Auth, getAuth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let messaging: Messaging;
let fireStore: Firestore;
let auth: Auth;
let storage: Storage;

type FirebaseAdminEnv = {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_CLIENT_ID: string;
  FIREBASE_CLIENT_CERT_URL: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
};

const getRequiredFirebaseAdminEnv = () => {
  const required: Record<keyof FirebaseAdminEnv, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    FIREBASE_CLIENT_CERT_URL: process.env.FIREBASE_CLIENT_CERT_URL,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  } as const;

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase Admin environment variables: ${missing.join(", ")}`
    );
  }

  return required as FirebaseAdminEnv;
};

try {
  const firebaseEnv = getRequiredFirebaseAdminEnv();

  const serviceAccount = {
    type: "service_account" as const,
    project_id: firebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    private_key_id: firebaseEnv.FIREBASE_PRIVATE_KEY_ID,
    private_key: firebaseEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: firebaseEnv.FIREBASE_CLIENT_EMAIL,
    client_id: firebaseEnv.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth" as const,
    token_uri: "https://oauth2.googleapis.com/token" as const,
    auth_provider_x509_cert_url:
      "https://www.googleapis.com/oauth2/v1/certs" as const,
    client_x509_cert_url: firebaseEnv.FIREBASE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com" as const,
  };

  const currentApps = getApps();

  if (!currentApps.length) {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as ServiceAccount),
      storageBucket: firebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    fireStore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    messaging = getMessaging(app);
  } else {
    const app = currentApps[0];
    fireStore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  throw error;
}

export { fireStore, auth, storage, messaging };

export const getTotalPages = async (
  firestoreQuery: FirebaseFirestore.Query<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >,
  pageSize: number
) => {
  const queryCount = firestoreQuery.count();
  const countSnapshot = await queryCount.get();
  const countData = countSnapshot.data();
  const total = countData.count;
  const totalPages = Math.ceil(total / pageSize);
  return { totalPages, totalItems: total };
};
