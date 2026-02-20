"use client";

import { useCallback, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  linkWithPopup,
  linkWithPhoneNumber,
  ConfirmationResult,
  User,
  RecaptchaVerifier,
} from "firebase/auth";

type LinkResult = {
  linked: boolean;
  providerId: "google.com" | "phone";
  user?: User;
  // For phone: you must confirm OTP to finish linking
  phonePending?: boolean;
};

type UseLinkAuthProvidersOptions = {
  user: User | null;

  // Required for phone linking (web)
  recaptchaVerifier: RecaptchaVerifier | null;

  // Optional side effects
  onToken?: (idToken: string, refreshToken: string) => Promise<void> | void;
  onLinked?: (result: LinkResult) => Promise<void> | void;

  // Optional UI
  toast?: {
    success: (title: string, opts?: { description?: string }) => void;
    error: (title: string, opts?: { description?: string }) => void;
    message?: (title: string, opts?: { description?: string }) => void;
  };
};

export function useLinkAuthProviders({
  user,
  recaptchaVerifier,
  onToken,
  onLinked,
  toast,
}: UseLinkAuthProvidersOptions) {
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [linkingPhone, setLinkingPhone] = useState(false);

  // Phone-link flow state
  const [phoneConfirmation, setPhoneConfirmation] =
    useState<ConfirmationResult | null>(null);
  const [phoneNumberPending, setPhoneNumberPending] = useState<string | null>(
    null
  );

  const resetPhoneLink = useCallback(() => {
    setPhoneConfirmation(null);
    setPhoneNumberPending(null);
  }, []);

  const linkGoogle = useCallback(async () => {
    if (!user) {
      toast?.error("Not signed in", { description: "Please sign in first." });
      return { linked: false, providerId: "google.com" } as const;
    }

    setLinkingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await linkWithPopup(user, provider); // provider linking [web:88]
      await result.user.reload();

      // If you rely on claims, request a fresh token
      const idToken = await result.user.getIdToken(true);
      const refreshToken = result.user.refreshToken;

      await onToken?.(idToken, refreshToken);

      const payload: LinkResult = {
        linked: true,
        providerId: "google.com",
        user: result.user,
      };
      await onLinked?.(payload);

      toast?.success("Google account linked", {
        description: "You can now sign in using Google as well.",
      });

      return payload;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/credential-already-in-use") {
        toast?.error("Google already linked", {
          description: "This Google account is already linked to another user.",
        });
      } else {
        toast?.error("Failed to link Google account");
      }
      return { linked: false, providerId: "google.com" } as const;
    } finally {
      setLinkingGoogle(false);
    }
  }, [user, onToken, onLinked, toast]);

  /**
   * Step 1 for phone linking:
   * sends OTP and stores ConfirmationResult; requires RecaptchaVerifier.
   * Firebase: use linkWithPhoneNumber for linking phone to an existing user. [web:119]
   */
  const startLinkPhone = useCallback(
    async (phoneNumberE164: string) => {
      if (!user) {
        toast?.error("Not signed in", { description: "Please sign in first." });
        return { linked: false, providerId: "phone" } as const;
      }
      if (!recaptchaVerifier) {
        toast?.error("reCAPTCHA not ready", {
          description: "reCAPTCHA verifier is required to link phone on web.",
        });
        return { linked: false, providerId: "phone" } as const;
      }

      setLinkingPhone(true);
      try {
        // Sends SMS, returns ConfirmationResult; still not linked until confirm() [web:119]
        const confirmation = await linkWithPhoneNumber(
          user,
          phoneNumberE164,
          recaptchaVerifier
        );

        setPhoneConfirmation(confirmation);
        setPhoneNumberPending(phoneNumberE164);

        toast?.success("OTP sent", {
          description: "Enter the OTP to link your phone number.",
        });

        const payload: LinkResult = {
          linked: false,
          providerId: "phone",
          phonePending: true,
        };
        await onLinked?.(payload);

        return payload;
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        toast?.error("Failed to send OTP", {
          description: code ? `Error: ${code}` : "Please try again.",
        });
        return { linked: false, providerId: "phone" } as const;
      } finally {
        setLinkingPhone(false);
      }
    },
    [user, recaptchaVerifier, onLinked, toast]
  );

  /**
   * Step 2 for phone linking:
   * confirm OTP, finalizes linking and refreshes token.
   */
  const confirmLinkPhoneOtp = useCallback(
    async (otp: string) => {
      if (!user) {
        toast?.error("Not signed in", { description: "Please sign in first." });
        return { linked: false, providerId: "phone" } as const;
      }
      if (!phoneConfirmation) {
        toast?.error("No OTP session", {
          description: "Please request OTP again.",
        });
        return { linked: false, providerId: "phone" } as const;
      }

      setLinkingPhone(true);
      try {
        const result = await phoneConfirmation.confirm(otp); // completes link/sign-in for that credential [web:119]
        await result.user.reload();

        const idToken = await result.user.getIdToken(true);
        const refreshToken = result.user.refreshToken;

        await onToken?.(idToken, refreshToken);

        const payload: LinkResult = {
          linked: true,
          providerId: "phone",
          user: result.user,
        };
        await onLinked?.(payload);

        toast?.success("Phone linked", {
          description: "You can now sign in using OTP as well.",
        });

        resetPhoneLink();
        return payload;
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        toast?.error("Invalid OTP", {
          description: code ? `Error: ${code}` : "Please try again.",
        });
        return { linked: false, providerId: "phone" } as const;
      } finally {
        setLinkingPhone(false);
      }
    },
    [user, phoneConfirmation, onToken, onLinked, toast, resetPhoneLink]
  );

  const phoneLinkState = useMemo(
    () => ({
      phoneConfirmationReady: !!phoneConfirmation,
      phoneNumberPending,
    }),
    [phoneConfirmation, phoneNumberPending]
  );

  return {
    // loading flags
    linkingGoogle,
    linkingPhone,

    // Google
    linkGoogle,

    // Phone (2-step)
    startLinkPhone,
    confirmLinkPhoneOtp,
    resetPhoneLink,
    phoneLinkState,
  };
}
