"use server";

import { fireStore } from "@/firebase/server";
import { notifyUser } from "@/lib/firebase/notifyUser";
import { sendUserPushNotification } from "@/lib/firebase/sendUserPushNotification";
import {
  UserNotification,
  UserNotificationStatus,
  UserNotificationType,
} from "@/types/notification";

type NotifyUserActionInput = {
  uid: string;
  title: string;
  body: string;
  url?: string;
  clickAction?: string;
  status?: UserNotificationStatus;
  type?: UserNotificationType;
  source?: UserNotification["source"];
  metadata?: Record<string, string>;
  /** When true, only sends a push notification — no entry is stored in Firestore. */
  pushOnly?: boolean;
};

export async function notifyUserAction(input: NotifyUserActionInput) {
  const { uid, title, body, pushOnly, ...rest } = input;

  if (!uid || !title || !body) {
    throw new Error("Missing required notification fields");
  }

  if (pushOnly) {
    return sendUserPushNotification({ uid, title, body, ...rest });
  }

  return notifyUser({ uid, title, body, ...rest });
}

type NotifyAdminsActionInput = Omit<NotifyUserActionInput, "uid">;

export async function notifyAdminsAction(input: NotifyAdminsActionInput) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const adminPhones = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (adminEmails.length === 0 && adminPhones.length === 0) return;

  const adminUids = new Set<string>();

  if (adminEmails.length > 0) {
    const emailSnap = await fireStore
      .collection("users")
      .where("email", "in", adminEmails)
      .get();
    emailSnap.docs.forEach((d) => adminUids.add(d.id));
  }

  if (adminPhones.length > 0) {
    const phoneSnap = await fireStore
      .collection("users")
      .where("phone", "in", adminPhones)
      .get();
    phoneSnap.docs.forEach((d) => adminUids.add(d.id));
  }

  const { pushOnly, ...rest } = input;

  await Promise.allSettled(
    Array.from(adminUids).map((uid) =>
      pushOnly
        ? sendUserPushNotification({ uid, ...rest })
        : notifyUser({ uid, ...rest })
    )
  );
}
