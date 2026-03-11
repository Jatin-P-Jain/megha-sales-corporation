import "server-only";

import { fireStore, messaging } from "@/firebase/server";
import {
  UserNotificationStatus,
  UserNotificationType,
} from "@/types/notification";

type SendUserPushNotificationInput = {
  uid: string;
  title: string;
  body: string;
  url?: string;
  clickAction?: string;
  status?: UserNotificationStatus;
  type?: UserNotificationType;
};

export async function sendUserPushNotification({
  uid,
  title,
  body,
  url,
  clickAction,
  status,
  type,
}: SendUserPushNotificationInput) {
  const tokensSnapshot = await fireStore
    .collection(`users/${uid}/fcmTokens`)
    .get();
  const tokens = tokensSnapshot.docs.map((doc) => doc.id);

  if (tokens.length === 0) {
    return {
      sent: 0,
      failed: 0,
      failedTokens: [] as string[],
      pushSkipped: "No FCM tokens found",
    };
  }

  const message = {
    webpush: {
      notification: {
        title,
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        click_action: url,
      },
      fcm_options: {
        link: url,
      },
      headers: {
        TTL: "3600",
      },
    },
    data: {
      uid,
      title,
      body,
      type: type || "system",
      url: url || "BROKEN_URL",
      click_action: clickAction || "DEFAULT_CLICK_ACTION",
      status: status || "NA",
    },
    tokens,
  };

  const response = await messaging.sendEachForMulticast(message);

  const failedTokens = response.responses.reduce<string[]>((acc, res, idx) => {
    if (!res.success) acc.push(tokens[idx]);
    return acc;
  }, []);

  await Promise.all(
    failedTokens.map((token) =>
      fireStore.doc(`users/${uid}/fcmTokens/${token}`).delete()
    )
  );

  return {
    sent: response.successCount,
    failed: response.failureCount,
    failedTokens,
  };
}
