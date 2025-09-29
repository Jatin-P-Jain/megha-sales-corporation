"use client";

import { useEffect } from "react";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";
import { app } from "@/firebase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";

export const PushHandler = () => {
  const auth = useAuth();
  const { currentUser } = auth;
  useEffect(() => {
    const setup = async () => {
      const supported = await isSupported();
      if (!supported) {
        console.warn("🚫 Messaging not supported");
        return;
      }

      const messaging = getMessaging(app);

      onMessage(messaging, (payload) => {
        console.log("📥 Foreground message received:", payload);

        const title =
          payload.notification?.title ?? payload.data?.title ?? "No title";
        const body =
          payload.notification?.body ?? payload.data?.body ?? "No body";

        {
          payload?.data?.uid === auth.clientUser?.uid &&
            toast.success(title, { description: body });
        }
      });
    };

    setup();
  }, []);

  return null;
};
