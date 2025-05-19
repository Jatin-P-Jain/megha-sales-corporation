import { useMobileOtp } from "@/hooks/useMobileOtp";
import { OtpVerificationForm } from "./otp-verification-form";
import { MobileLoginForm } from "./mobile-login-form";
import { useRecaptcha } from "@/hooks/useRecaptcha";

export function MobileAuthWrapper({ onSuccess }: { onSuccess?: () => void }) {
  const recaptchaVerifier = useRecaptcha();
  const { otpSent, sendingOtp, isVerifying, sendOtp, verifyOtp } = useMobileOtp(
    { onSuccess, appVerifier: recaptchaVerifier },
  );

  return otpSent ? (
    <OtpVerificationForm isVerifying={isVerifying} onSubmit={verifyOtp} />
  ) : (
    <MobileLoginForm sendingOtp={sendingOtp} onSubmit={sendOtp} />
  );
}
