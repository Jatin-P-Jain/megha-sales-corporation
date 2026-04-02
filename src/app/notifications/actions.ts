"use server";

import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";

async function getCurrentUidOrThrow() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = await auth.verifyIdToken(token);
  return decoded.uid;
}

export async function markNotificationRead(id: string) {
  if (!id) {
    throw new Error("Notification id is required");
  }

  const uid = await getCurrentUidOrThrow();

  const ref = fireStore
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .doc(id);

  await ref.update({ read: true, readAt: new Date().toISOString() });

  return { success: true };
}

export async function markAllNotificationsRead() {
  const uid = await getCurrentUidOrThrow();

  const snapshot = await fireStore
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .where("read", "==", false)
    .get();

  if (snapshot.empty) {
    return { success: true, updated: 0 };
  }

  const now = new Date().toISOString();
  const batch = fireStore.batch();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true, readAt: now });
  });

  await batch.commit();

  return { success: true, updated: snapshot.size };
}
