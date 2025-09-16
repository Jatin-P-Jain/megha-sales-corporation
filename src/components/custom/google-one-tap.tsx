"use client";

import { useEffect } from "react";
import { auth } from "@/firebase/client";
import {
  GoogleAuthProvider,
  signInWithCredential,
  getIdTokenResult,
} from "firebase/auth";
import { markOneTapAsFinished } from "@/hooks/useOneTapReady";
import { setToken } from "@/context/actions";

export default function GoogleOneTap({
  setSigningIn,
}: {
  setSigningIn: (signingIn: boolean) => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initGoogleOneTap = () => {
      window.google.accounts.id.disableAutoSelect();

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response) => {
          console.log("🟡 Google One Tap callback triggered");
          try {
            setSigningIn(true);
            const credential = GoogleAuthProvider.credential(
              response.credential,
            );
            const result = await signInWithCredential(auth, credential);
            const user = result.user;

            console.log("✅ Firebase user:", user);

            // Get ID token claims
            const tokenResult = await getIdTokenResult(user, true);
            setToken(tokenResult.token, user.refreshToken);
            setSigningIn(false);
          } catch (err) {
            console.error("❌ Firebase sign-in error:", err);
            setSigningIn(false);
          }
        },
        cancel_on_tap_outside: false,
        auto_select: false,
      });

      window.google.accounts.id.prompt((notification) => {
        console.log("🔍 One Tap state:", {
          displayed: notification.isDisplayed(),
          skipped: notification.isSkippedMoment(),
          dismissed: notification.isDismissedMoment(),
        });

        // ✅ Allow PWA logic to proceed
        markOneTapAsFinished();
      });
    };

    if (window.google && window.google.accounts) {
      initGoogleOneTap();
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(interval);
          initGoogleOneTap();
        }
      }, 100);
    }
  }, []);

  return null;
}
