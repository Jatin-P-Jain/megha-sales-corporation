"use server";
import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";
import type { AccountTimelineEventType } from "@/types/user";

export async function addAccountTimelineEvent({
  type,
  label,
  detail,
  uid: explicitUid,
}: {
  type: AccountTimelineEventType;
  label: string;
  detail?: string;
  /** Pass explicitly when calling from admin/server context without a cookie */
  uid?: string;
}) {
  let uid = explicitUid;

  if (!uid) {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;
    if (!token) throw new Error("Unauthorized");
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  }

  await fireStore
    .collection("users")
    .doc(uid)
    .collection("timeline")
    .add({
      type,
      label,
      detail: detail ?? null,
      createdAt: new Date(),
    });
}
