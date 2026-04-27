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

type NotifyRecipientsMode = "role-staff" | "role-admin-only";

type NotifyAdminRecipientsActionInput = NotifyAdminsActionInput & {
  recipientsMode: NotifyRecipientsMode;
};

async function deliverToUids(
  uids: string[],
  input: NotifyAdminsActionInput,
  logTag: string
) {
  if (uids.length === 0) return;

  const { pushOnly, ...rest } = input;

  try {
    await Promise.allSettled(
      uids.map((uid) =>
        pushOnly
          ? sendUserPushNotification({ uid, ...rest })
          : notifyUser({ uid, ...rest })
      )
    );
  } catch (err) {
    console.error(`[${logTag}] Failed:`, err);
  }
}

async function resolveUidsFromRoles(roles: string[]) {
  if (roles.length === 0) return [];

  const snapshot =
    roles.length === 1
      ? await fireStore
          .collection("userGate")
          .where("userRole", "==", roles[0])
          .get()
      : await fireStore
          .collection("userGate")
          .where("userRole", "in", roles)
          .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => doc.id);
}

/**
 * Unified admin/staff notification entrypoint.
 * - role-staff: userGate.userRole in [admin, dispatcher, accountant, sales]
 * - role-admin-only: userGate.userRole == admin
 */
export async function notifyAdminRecipientsAction(
  input: NotifyAdminRecipientsActionInput
) {
  const { recipientsMode, ...payload } = input;

  if (recipientsMode === "role-staff") {
    const uids = await resolveUidsFromRoles([
      "admin",
      "dispatcher",
      "accountant",
      "sales",
    ]);
    await deliverToUids(
      uids,
      payload,
      "notifyAdminRecipientsAction:role-staff"
    );
    return;
  }

  const uids = await resolveUidsFromRoles(["admin"]);
  await deliverToUids(
    uids,
    payload,
    "notifyAdminRecipientsAction:role-admin-only"
  );
}
