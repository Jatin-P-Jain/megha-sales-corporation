import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { UsersDirectory, UserData, UserGate } from "./types";

// Auto-init
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore(getApps()[0]!);

// Region must match the Firestore database location for the Eventarc trigger to fire.
// Dev Firestore: asia-south1  |  Prod Firestore: asia-south2
// Set FIRESTORE_REGION in functions/.env (dev) and functions/.env.prod (prod).
// defineString (Firebase Params API) is resolved by Firebase CLI *before* module analysis,
// unlike process.env which is read during module load (too early for env file injection).
const REGION = defineString("FIRESTORE_REGION", { default: "asia-south1" });

// From users/{uid} - require gate exists
export const syncUsersDirectoryFromUsers = onDocumentWritten(
  { document: "users/{uid}", region: REGION },
  async (event) => {
    const { uid } = event.params;
    const snap = event.data?.after;
    if (!snap?.exists || snap.data()?.uid !== uid) return;

    const userData = snap.data() as UserData;
    await syncToDirectory(db, uid, userData);
  }
);

// From userGate/{uid} - require users exists
export const syncUsersDirectoryFromUserGate = onDocumentWritten(
  { document: "userGate/{uid}", region: REGION },
  async (event) => {
    const { uid } = event.params;
    const snap = event.data?.after;
    if (!snap?.exists) return;

    const gateData = snap.data() as UserGate;
    await syncToDirectory(db, uid, undefined, gateData);
  }
);

// Unified sync: Requires BOTH docs
async function syncToDirectory(
  db: FirebaseFirestore.Firestore,
  uid: string,
  userData?: UserData,
  gateData?: UserGate
): Promise<string> {
  // Explicit return type
  // Fetch missing data
  const userSnap = userData
    ? null
    : await db.collection("users").doc(uid).get();
  const gateSnap = gateData
    ? null
    : await db.collection("userGate").doc(uid).get();

  if (!userSnap?.exists && !userData) return "Missing users data";
  if (!gateSnap?.exists && !gateData) return "Missing userGate data";

  const fullUserData = userData || (userSnap!.data() as UserData);
  const fullGateData = gateData || (gateSnap!.data() as UserGate);

  const directoryData: UsersDirectory = { ...fullUserData, ...fullGateData };
  await db
    .collection("usersDirectory")
    .doc(uid)
    .set(directoryData, { merge: false });

  return `Synced usersDirectory/${uid}`; // Success log
}
