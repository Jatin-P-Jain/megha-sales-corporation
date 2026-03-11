import "server-only";

import { fireStore } from "@/firebase/server";
import {
  UserNotification,
  UserNotificationStatus,
  UserNotificationType,
} from "@/types/notification";

type CreateUserNotificationInput = {
  uid: string;
  title: string;
  body: string;
  url?: string;
  clickAction?: string;
  type?: UserNotificationType;
  status?: UserNotificationStatus;
  source?: UserNotification["source"];
  metadata?: Record<string, string>;
};

export async function createUserNotification({
  uid,
  title,
  body,
  url,
  clickAction,
  type = "system",
  status = "na",
  source = "system",
  metadata,
}: CreateUserNotificationInput) {
  if (!uid || !title || !body) {
    throw new Error("uid, title and body are required to create notification");
  }

  const ref = fireStore
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .doc();

  const payload: UserNotification = {
    uid,
    type,
    title,
    body,
    url: url ?? "/",
    clickAction: clickAction ?? "open",
    status,
    read: false,
    readAt: null,
    source,
    createdAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  await ref.set(payload);

  return { id: ref.id };
}
