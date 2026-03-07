import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { UsersDirectory, UserData, UserGate } from "./types";

// Auto-init
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore(getApps()[0]!);

// From users/{uid} - require gate exists
export const syncUsersDirectoryFromUsers = onDocumentWritten(
  { document: "users/{uid}", region: "asia-south1" },
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
  { document: "userGate/{uid}", region: "asia-south1" },
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
