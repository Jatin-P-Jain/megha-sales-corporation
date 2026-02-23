"use client";

import { useCallback, useState } from "react";
import {
  ConfirmationResult,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from "firebase/auth";
import { toast } from "sonner";

import { useAuthActions, useAuthState } from "@/context/useAuth";
import { handleFirebaseAuthError } from "@/lib/firebase/firebaseErrorHandler";
import { setToken } from "@/context/actions";

export function useMobileOtp({
  onSuccess,
  appVerifier,
  ensureRecaptcha,
  resetRecaptcha,
  linkPhone = false,
}: {
  onSuccess?: (() => void) | undefined;
  appVerifier: RecaptchaVerifier | null;
  ensureRecaptcha?: () => Promise<RecaptchaVerifier>;
  resetRecaptcha?: () => void;
  linkPhone?: boolean;
}) {
  const { handleSendOTP, verifyOTP } = useAuthActions(); // ✅ actions-only
  const { currentUser } = useAuthState(); // ✅ only state you need (for linkPhone)

  const [mobileNumber, setMobileNumber] = useState("");
  const [otpReset, setOtpReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const resetOtp = useCallback(() => {
    setOtpSent(false);
    setOtpReset(true);
    setConfirmationResult(null);
  }, []);

  const sendOtp = useCallback(
    async (mobile: string, isResent: boolean = false) => {
      try {
        setSendingOtp(true);

        const verifierToUse =
          appVerifier ?? (ensureRecaptcha ? await ensureRecaptcha() : null);

        if (!verifierToUse) {
          toast.error("Recaptcha not ready. Please try again in a moment.");
          return;
        }

        const confirmation = await handleSendOTP(mobile, verifierToUse);

        setMobileNumber(mobile);
        setOtpSent(true);
        setOtpReset(false);
        setConfirmationResult(confirmation);

        if (!isResent) toast.success("OTP sent successfully");
      } catch (e) {
        console.error(e);
        toast.error("Failed to send OTP", {
          description:
            e instanceof Error ? e.message : "An unknown error occurred",
        });
      } finally {
        setSendingOtp(false);
        try {
          resetRecaptcha?.();
        } catch {
          // ignore
        }
      }
    },
    [appVerifier, ensureRecaptcha, handleSendOTP, resetRecaptcha]
  );

  const verifyOtp = useCallback(
    async (otp: string) => {
      try {
        if (!confirmationResult) throw new Error("No confirmation result");

        setIsVerifying(true);

        if (linkPhone) {
          const credential = PhoneAuthProvider.credential(
            confirmationResult.verificationId,
            otp
          );

          if (!currentUser) throw new Error("No authenticated user to link");

          try {
            await linkWithCredential(currentUser, credential);
            const token = await currentUser.getIdToken(true);
            await setToken(token, currentUser.refreshToken);
          } catch (error: unknown) {
            handleFirebaseAuthError(error);
            return;
          }
        } else {
          await verifyOTP(otp, confirmationResult);
        }

        onSuccess?.();
        resetOtp();
      } catch (e) {
        handleFirebaseAuthError(e);
      } finally {
        setIsVerifying(false);
        try {
          resetRecaptcha?.();
        } catch {
          // ignore
        }
      }
    },
    [
      confirmationResult,
      currentUser,
      linkPhone,
      onSuccess,
      resetOtp,
      resetRecaptcha,
      verifyOTP,
    ]
  );

  return {
    mobileNumber,
    otpReset,
    otpSent,
    sendingOtp,
    isVerifying,
    sendOtp,
    verifyOtp,
    resetOtp,
  };
}
