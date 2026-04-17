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
import { useAuthState } from "@/context/useAuth";

export default function GoogleOneTap({
  setSigningIn,
  setLoginSuccess,
}: {
  setSigningIn: (signingIn: boolean) => void;
  setLoginSuccess: (loginSuccess: boolean) => void;
}) {
  const { currentUser, authLoading } = useAuthState();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always try to close any existing prompt when this component runs
    try {
      window.google?.accounts?.id?.cancel();
    } catch {}

    // ✅ If auth state is still loading, do nothing yet.
    if (authLoading) return;

    // ✅ If the user is already logged in, never show One Tap again on this page.
    if (currentUser) {
      markOneTapAsFinished();
      return;
    }

    let cancelled = false;

    const initGoogleOneTap = () => {
      // Prevent auto-selection loops
      window.google.accounts.id.disableAutoSelect();

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response) => {
          if (cancelled) return;

          try {
            setSigningIn(true);

            const credential = GoogleAuthProvider.credential(
              response.credential,
            );

            const result = await signInWithCredential(auth, credential);
            const user = result.user;

            const tokenResult = await getIdTokenResult(user, true);
            const { claimsUpdated } = await setToken(
              tokenResult.token,
              user.refreshToken,
            );
            if (claimsUpdated) {
              const freshTokenResult = await getIdTokenResult(user, true);
              await setToken(freshTokenResult.token, user.refreshToken);
            }

            // ✅ Close prompt right away on success
            window.google.accounts.id.cancel();

            setLoginSuccess(true);
          } catch (err) {
            console.error("❌ Firebase sign-in error:", err);
            setLoginSuccess(false);
          } finally {
            setSigningIn(false);
          }
        },
        cancel_on_tap_outside: false,
        auto_select: false,
      });

      // Only prompt when logged out (we’re in that branch)
      window.google.accounts.id.prompt(() => {
        markOneTapAsFinished();
      });
    };

    if (window.google?.accounts?.id) {
      initGoogleOneTap();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleOneTap();
        }
      }, 100);

      return () => clearInterval(interval);
    }

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {}
    };
  }, [currentUser, authLoading, setSigningIn, setLoginSuccess]);

  return null;
}
