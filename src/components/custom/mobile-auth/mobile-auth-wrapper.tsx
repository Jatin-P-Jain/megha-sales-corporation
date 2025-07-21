import { useMobileOtp } from "@/hooks/useMobileOtp";
import { OtpVerificationForm } from "./otp-verification-form";
import { MobileLoginForm } from "./mobile-login-form";
import { useRecaptcha } from "@/hooks/useRecaptcha";

export function MobileAuthWrapper({ onSuccess }: { onSuccess?: () => void }) {
  const recaptchaVerifier = useRecaptcha();
  const { mobileNumber, isVerifying, otpSent, sendingOtp, sendOtp, verifyOtp } =
    useMobileOtp({ onSuccess, appVerifier: recaptchaVerifier });

  return otpSent ? (
    <OtpVerificationForm
      mobileNumber={mobileNumber}
      isVerifying={isVerifying}
      onSubmit={verifyOtp}
      recaptchaVerifier={recaptchaVerifier}
      onSuccess={onSuccess}
    />
  ) : (
    <MobileLoginForm sendingOtp={sendingOtp} onSubmit={sendOtp} />
  );
}
