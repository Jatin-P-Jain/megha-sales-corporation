"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  resendSeconds = 30,
}: {
  onSuccess?: (() => void) | undefined;
  appVerifier: RecaptchaVerifier | null;
  ensureRecaptcha?: () => Promise<RecaptchaVerifier>;
  resetRecaptcha?: () => void;
  linkPhone?: boolean;
  resendSeconds?: number;
}) {
  const { handleSendOTP, verifyOTP } = useAuthActions();
  const { currentUser } = useAuthState();

  const [mobileNumber, setMobileNumber] = useState("");
  const [otpReset, setOtpReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  // ✅ resend countdown state
  const [resendIn, setResendIn] = useState(0);

  const resetOtp = useCallback(() => {
    setOtpSent(false);
    setOtpReset(true);
    setConfirmationResult(null);
    setMobileNumber("");
    setResendIn(0);
  }, []);

  const lockMobileInput = useMemo(() => otpSent, [otpSent]);
  const canResend = useMemo(
    () => otpSent && resendIn === 0 && !sendingOtp,
    [otpSent, resendIn, sendingOtp]
  );

  // ✅ countdown starts when otpSent becomes true, stops when resetOtp() called
  useEffect(() => {
    if (!otpSent) {
      setResendIn(0);
      return;
    }

    setResendIn((v) => (v > 0 ? v : resendSeconds));

    const t = window.setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => window.clearInterval(t);
  }, [otpSent, resendSeconds]);

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

  // ✅ resend uses the last mobileNumber by default (no UI coupling)
  const resendOtp = useCallback(async () => {
    const mobile = (mobileNumber || "").trim();
    if (!mobile) return;
    if (!canResend) return;
    await sendOtp(mobile, true);
    // restart countdown after resend
    setResendIn(resendSeconds);
  }, [mobileNumber, canResend, resendSeconds, sendOtp]);

  // ✅ edit mobile: reset the OTP flow (consumer can clear form fields)
  const editMobile = useCallback(() => {
    resetOtp();
  }, [resetOtp]);

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
            const { claimsUpdated } = await setToken(
              token,
              currentUser.refreshToken
            );
            if (claimsUpdated) {
              const freshToken = await currentUser.getIdToken(true);
              await setToken(freshToken, currentUser.refreshToken);
            }
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
    // existing
    mobileNumber,
    otpReset,
    otpSent,
    sendingOtp,
    isVerifying,
    sendOtp,
    verifyOtp,
    resetOtp,

    // ✅ new
    resendIn,
    canResend,
    resendOtp,
    editMobile,
    lockMobileInput,
  };
}
