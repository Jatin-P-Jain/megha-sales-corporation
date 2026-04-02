"use server";

import { notifyUser } from "@/lib/firebase/notifyUser";
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
};

export async function notifyUserAction(input: NotifyUserActionInput) {
  const { uid, title, body } = input;

  if (!uid || !title || !body) {
    throw new Error("Missing required notification fields");
  }

  return notifyUser(input);
}
