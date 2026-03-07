"use client";

import { AccountStatus, UserRole } from "@/context/UserGateProvider";
import { auth, firestore } from "@/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function updateUserGate(
  profileComplete: boolean,
  userRole: UserRole,
  accountStatus: AccountStatus
) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const ref = doc(firestore, "userGate", u.uid);
  await setDoc(
    ref,
    { profileComplete, userRole, accountStatus, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
