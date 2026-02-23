// app/login/mobile-auth/mobile-auth-wrapper.tsx (or your path)
"use client";

import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useMemo } from "react";
import { OtpVerificationForm } from "./otp-verification-form";
import { MobileLoginForm } from "./mobile-login-form";

export function MobileAuthWrapper({ onSuccess }: { onSuccess?: () => void }) {
  const recaptcha = useRecaptcha({ enabled: true }); // keep hook stable
  const recaptchaVerifier = recaptcha.verifier;

  const {
    mobileNumber,
    isVerifying,
    otpSent,
    sendingOtp,
    sendOtp,
    verifyOtp,
    resetOtp,
  } = useMobileOtp({
    onSuccess: () => {
      resetOtp(); // ensure we go back to login view cleanly
      onSuccess?.();
    },
    appVerifier: recaptchaVerifier,
    ensureRecaptcha: recaptcha.ensureReady,
    resetRecaptcha: recaptcha.reset,
  });

  // Derive mode: if OTP is sent, show verify, else show login
  const mode = useMemo(() => (otpSent ? "verify" : "login"), [otpSent]);

  if (mode === "verify") {
    return (
      <OtpVerificationForm
        mobileNumber={mobileNumber}
        isVerifying={isVerifying}
        recaptchaVerifier={recaptchaVerifier}
        onSuccess={onSuccess}
        onSubmit={verifyOtp}
        onEdit={() => {
          resetOtp();
          recaptcha.reset?.();
        }}
      />
    );
  }

  return <MobileLoginForm sendingOtp={sendingOtp} onSubmit={sendOtp} />;
}
