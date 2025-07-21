"use client";
import { useState } from "react";
import {
  ConfirmationResult,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from "firebase/auth";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";
import { handleFirebaseAuthError } from "@/lib/firebase/firebaseErrorHandler";
import { setToken } from "@/context/actions";

export function useMobileOtp({
  onSuccess,
  appVerifier,
  isProfile,
}: {
  onSuccess?: (() => void) | undefined;
  appVerifier: RecaptchaVerifier | null;
  isProfile?: boolean;
}) {
  const auth = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpReset, setOtpReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult>();

  const sendOtp = async (mobile: string, isResent: boolean = false) => {
    try {
      if (!appVerifier) {
        toast.error("Recaptcha not ready. Please try again in a moment.");
        return;
      }
      setSendingOtp(true);
      const confirmation = await auth?.handleSendOTP(mobile, appVerifier);
      setMobileNumber(mobile);
      setOtpSent(true);
      setTimeout(() => {
        setConfirmationResult(confirmation);
      }, 0);
      !isResent && toast.success("OTP sent successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      if (!confirmationResult) throw new Error("No confirmation result");
      setIsVerifying(true);
      if (isProfile) {
        const credential = PhoneAuthProvider.credential(
          confirmationResult.verificationId,
          otp,
        );

        // Assume `auth.currentUser` is logged in via Google/email already
        const user = auth.currentUser;

        if (user) {
          try {
            await linkWithCredential(user, credential);
            const token = await user.getIdToken(true);
            await setToken(token, user.refreshToken);
          } catch (error: unknown) {
            handleFirebaseAuthError(error);
            return;
          }
        }
      } else {
        try {
          const user = await auth?.verifyOTP(otp, confirmationResult);
          if (!user) {
            toast.error("OTP verification failed. Please try again.");
            return;
          }
        } catch (error: unknown) {
          handleFirebaseAuthError(error);
          return;
        }
      }
      onSuccess?.();
    } catch (e) {
      console.error(e);
      toast.error("Verification failed.");
      throw e;
    } finally {
      setOtpSent(false);
      setOtpReset(true);
      setIsVerifying(false);
    }
  };

  return {
    mobileNumber,
    otpReset,
    otpSent,
    sendingOtp,
    isVerifying,
    sendOtp,
    verifyOtp,
  };
}
