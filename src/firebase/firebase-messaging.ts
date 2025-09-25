import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./client"; // your firebase app initialization

export const getFcmToken = async (vapidKey: string) => {
  const supported = await isSupported();
  if (!supported) return null;

  const messaging = getMessaging(app);
  const registration = await navigator.serviceWorker.ready;

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
};
