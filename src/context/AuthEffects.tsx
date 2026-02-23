"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getMessaging, getToken } from "firebase/messaging";

import { useAuthState } from "./auth-context";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";

import { getDeviceMetadata } from "@/lib/utils";
import { saveFcmToken } from "@/firebase/saveFcmToken";

type AccountStatusUI =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated"
  | "incomplete";

export default function AuthEffects() {
  const { currentUser, clientUser } = useAuthState();

  // Inactivity limit (derived from userType, but if you prefer claims-based, we can move it here too)
  const inactivityLimit =
    clientUser?.userType === "admin"
      ? parseInt(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0", 10)
      : parseInt(process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0", 10);

  useMonitorInactivity(currentUser, inactivityLimit);

  // Toast on account status transitions (NOT on first load)
  const prevStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentStatus = (clientUser?.accountStatus ?? undefined) as
      | AccountStatusUI
      | undefined;
    const previousStatus = prevStatusRef.current;

    if (
      previousStatus !== undefined &&
      currentStatus &&
      currentStatus !== previousStatus
    ) {
      if (currentStatus === "approved") {
        toast.success("Account Approved!", {
          description:
            "Your account has been approved. All features are now available to you.",
          duration: 5000,
        });
      } else if (currentStatus === "rejected") {
        toast.error("Account Rejected", {
          description:
            clientUser?.rejectionReason ||
            "Please contact support for more information.",
          duration: 5000,
        });
      } else if (currentStatus === "suspended") {
        toast.error("Account Suspended", {
          description: "Please contact support for more information.",
          duration: 5000,
        });
      } else if (currentStatus === "deactivated") {
        toast.error("Account Deactivated", {
          description: "Please contact support for more information.",
          duration: 5000,
        });
      }
    }

    prevStatusRef.current = currentStatus;
  }, [clientUser]);

  // FCM refresh/save when logged in
  const refreshAndSaveFcmToken = useCallback(async () => {
    if (!currentUser) return;

    try {
      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
      const token = await getToken(messaging, { vapidKey });
      if (!token) return;

      const metadata = getDeviceMetadata();
      await saveFcmToken(currentUser.uid, token, metadata);
    } catch (e) {
      console.error("Failed to refresh and save FCM token", e);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshAndSaveFcmToken();
  }, [refreshAndSaveFcmToken]);

  return null;
}
