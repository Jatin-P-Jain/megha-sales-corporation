"use client";

import { useEffect, useCallback } from "react";
import { getMessaging, getToken } from "firebase/messaging";

import { useAuthState } from "./auth-context"; // adjust import
import { useUserGate } from "@/context/UserGateProvider";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";

import { getDeviceMetadata } from "@/lib/utils";
import { saveFcmToken } from "@/firebase/saveFcmToken";

export default function AuthEffects() {
  const { currentUser, isAdmin } = useAuthState();

  // Gate is always-on: use this for access/status logic
  useUserGate();

  const inactivityLimit = isAdmin
    ? parseInt(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0", 10)
    : parseInt(process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0", 10);

  useMonitorInactivity(currentUser, inactivityLimit);

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
