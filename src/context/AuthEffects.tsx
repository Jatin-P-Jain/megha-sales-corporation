"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getMessaging, getToken } from "firebase/messaging";

import { useAuthState } from "./auth-context"; // adjust import
import { useUserGate } from "@/context/UserGateProvider";
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
  const { currentUser } = useAuthState();

  // Gate is always-on: use this for access/status logic + toasts
  const { gate, gateLoading, gateSyncing } = useUserGate();

  // Inactivity limit should prefer gate.userType (fast, global)
  const userType = gate?.userType;

  const inactivityLimit =
    userType === "admin"
      ? parseInt(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0", 10)
      : parseInt(process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0", 10);

  useMonitorInactivity(currentUser, inactivityLimit);

  // Toast on account status transitions (NOT on first stable load)
  const prevStatusRef = useRef<AccountStatusUI | undefined>(undefined);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      didInitRef.current = false;
      prevStatusRef.current = undefined;
      return;
    }

    if (gateLoading) return;

    const currentStatus = (gate?.accountStatus ?? undefined) as
      | AccountStatusUI
      | undefined;
    const previousStatus = prevStatusRef.current;

    // First stable value: baseline, no toast
    if (!didInitRef.current) {
      didInitRef.current = true;
      prevStatusRef.current = currentStatus;
      return;
    }

    // Optional: avoid cache-only flip noise; wait for server-confirmed snapshot
    if (gateSyncing) {
      prevStatusRef.current = currentStatus;
      return;
    }

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
            gate?.rejectionReason ||
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
  }, [
    currentUser,
    gateLoading,
    gateSyncing,
    gate?.accountStatus,
    gate?.rejectionReason,
  ]);

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
