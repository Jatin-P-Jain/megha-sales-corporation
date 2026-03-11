"use client";

import { useEffect, useRef } from "react";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";
import { app } from "@/firebase/client";
import { toast } from "sonner";
import { useAuthState } from "@/context/auth-context";

export const PushHandler = () => {
  const { currentUser } = useAuthState();
  const lastToastKeyRef = useRef<string>("");
  const lastToastAtRef = useRef<number>(0);

  const showIncomingToast = ({
    title,
    body,
    type,
    status,
  }: {
    title: string;
    body: string;
    type?: string;
    status?: string;
  }) => {
    const toastConfig = { description: body, duration: 5000 };

    if (type === "account") {
      if (
        status === "rejected" ||
        status === "suspended" ||
        status === "deactivated"
      ) {
        toast.error(title, toastConfig);
        return;
      }
      toast.success(title, toastConfig);
      return;
    }

    if (type === "order") {
      toast.success(title, toastConfig);
      return;
    }

    if (type === "enquiry") {
      toast(title, toastConfig);
      return;
    }

    toast(title, toastConfig);
  };

  useEffect(() => {
    const setup = async () => {
      console.log("sw:", "serviceWorker" in navigator);
      console.log("pushManager:", "PushManager" in window);
      console.log("notifications:", "Notification" in window);
      console.log("notification permission:", Notification.permission);
      console.log("indexedDB:", "indexedDB" in window);
      const supported = await isSupported();
      if (!supported) {
        console.warn("🚫 Messaging not supported");
        return;
      }

      const messaging = getMessaging(app);

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("📥 Foreground message received:", payload);

        const title =
          payload.notification?.title ?? payload.data?.title ?? "No title";
        const body =
          payload.notification?.body ?? payload.data?.body ?? "No body";
        const type = payload.data?.type;
        const status = payload.data?.status;
        const uid = payload.data?.uid;

        const now = Date.now();
        const key = `${uid}|${type}|${status}|${title}|${body}`;
        const isRapidDuplicate =
          lastToastKeyRef.current === key &&
          now - lastToastAtRef.current < 2000;
        if (isRapidDuplicate) return;

        if (uid === currentUser?.uid) {
          // Show toast only if the message is intended for the current user
          showIncomingToast({ title, body, type, status });
          lastToastKeyRef.current = key;
          lastToastAtRef.current = now;
        }
      });

      return unsubscribe;
    };

    let unsubscribeFn: (() => void) | undefined;
    void setup().then((unsub) => {
      unsubscribeFn = unsub;
    });

    return () => {
      unsubscribeFn?.();
    };
  }, [currentUser?.uid]);

  return null;
};
