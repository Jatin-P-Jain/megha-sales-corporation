import "server-only";

import { createUserNotification } from "@/lib/firebase/createUserNotification";
import { sendUserPushNotification } from "@/lib/firebase/sendUserPushNotification";
import {
  UserNotification,
  UserNotificationStatus,
  UserNotificationType,
} from "@/types/notification";

type NotifyUserInput = {
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

export async function notifyUser({
  uid,
  title,
  body,
  url,
  clickAction,
  status,
  type,
  source,
  metadata,
}: NotifyUserInput) {
  const storedNotification = await createUserNotification({
    uid,
    title,
    body,
    url,
    clickAction,
    status,
    type,
    source,
    metadata,
  });

  try {
    const pushResult = await sendUserPushNotification({
      uid,
      title,
      body,
      url,
      clickAction,
      status,
      type,
    });

    return {
      success: true,
      notificationId: storedNotification.id,
      ...pushResult,
    };
  } catch (pushError) {
    // Persisted notification should still be considered successful even if push fails.
    console.error("Failed to send user push notification:", pushError);
    return {
      success: true,
      notificationId: storedNotification.id,
      sent: 0,
      failed: 0,
      failedTokens: [] as string[],
      pushSkipped: "Push delivery failed",
    };
  }
}
