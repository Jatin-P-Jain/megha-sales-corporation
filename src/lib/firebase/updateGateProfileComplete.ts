"use client";

import { auth, firestore } from "@/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function updateGateProfileComplete(profileComplete: boolean) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const ref = doc(firestore, "userGate", u.uid);
  await setDoc(
    ref,
    { profileComplete, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
