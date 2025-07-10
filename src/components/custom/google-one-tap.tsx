"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/firebase/client";
import {
  GoogleAuthProvider,
  signInWithCredential,
  getIdTokenResult,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { markOneTapAsFinished } from "@/hooks/useOneTapReady";

export default function GoogleOneTap() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initGoogleOneTap = () => {
      window.google.accounts.id.disableAutoSelect();

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: any) => {
          console.log("🟡 Google One Tap callback triggered");
          try {
            const credential = GoogleAuthProvider.credential(
              response.credential,
            );
            const result = await signInWithCredential(auth, credential);
            const user = result.user;

            console.log("✅ Firebase user:", user);

            // Get ID token claims
            const tokenResult = await getIdTokenResult(user, true);
            const claims = tokenResult.claims;

            // You can also check Firestore for extra profile fields if needed
            const userDoc = await getDoc(doc(firestore, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;

            const phone = user.phoneNumber?.slice(3); // remove +91 or +xx
            const role = claims?.admin ? "admin" : userData?.role;

            console.log("📱 Phone:", phone, "| 🧑‍💼 Role:", role);

            if (!phone || !role) {
              console.log(
                "⛔ Incomplete profile — redirecting to /account/profile",
              );
              window.location.assign("/account/profile");
            } else {
              console.log("✅ Profile complete — redirecting to /");
              window.location.assign("/");
            }
          } catch (err) {
            console.error("❌ Firebase sign-in error:", err);
          }
        },
        cancel_on_tap_outside: false,
        auto_select: true,
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
