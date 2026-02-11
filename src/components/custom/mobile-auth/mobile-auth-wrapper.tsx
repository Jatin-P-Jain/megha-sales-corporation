import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useEffect, useState } from "react";
import { OtpVerificationForm } from "./otp-verification-form";
import { MobileLoginForm } from "./mobile-login-form";
import { useRecaptcha } from "@/hooks/useRecaptcha";

export function MobileAuthWrapper({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "verify">("login");

  const recaptchaVerifier = useRecaptcha({ enabled: mode === "login" }); // only enable when in login mode
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
      setMode("login");
      onSuccess?.();
    },
    appVerifier: recaptchaVerifier,
  });

  useEffect(() => {
    if (otpSent) {
      setMode("verify");
    }
  }, [otpSent]);

  return mode === "verify" ? (
    <OtpVerificationForm
      mobileNumber={mobileNumber}
      isVerifying={isVerifying}
      recaptchaVerifier={recaptchaVerifier}
      onSuccess={onSuccess}
      onSubmit={verifyOtp}
      onEdit={() => {
        resetOtp();
        setMode("login");
      }} // new prop
    />
  ) : (
    <MobileLoginForm sendingOtp={sendingOtp} onSubmit={sendOtp} />
  );
}
