"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, PencilIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { mobileOtpSchema } from "@/validation/loginUser";
import OTPInput from "../otp-input";
import { useEffect, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";

export function OtpVerificationForm({
  mobileNumber,
  isVerifying,
  recaptchaVerifier,
  onSuccess,
  onSubmit,
  onEdit,
}: {
  mobileNumber: string;
  isVerifying: boolean;
  recaptchaVerifier: RecaptchaVerifier | null;
  onSuccess?: () => void;
  onSubmit: (otp: string) => void;
  onEdit: () => void;
}) {
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 min = 300s

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const [timer, setTimer] = useState(30); // countdown
  const [canResend, setCanResend] = useState(false);
  const [hasResentOnce, setHasResentOnce] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "done">(
    "idle",
  );

  const { sendingOtp, sendOtp } = useMobileOtp({
    onSuccess,
    appVerifier: recaptchaVerifier,
  });

  // Start initial timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const form = useForm<z.infer<typeof mobileOtpSchema>>({
    resolver: zodResolver(mobileOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleResend = async () => {
    if (hasResentOnce || sendingOtp) return;
    try {
      setResendStatus("sending");
      await sendOtp(mobileNumber, true);
      setResendStatus("done");
      setHasResentOnce(true);
      toast.success("OTP resent successfully");
      setExpiryTimer(300); // Reset expiry timer to 5 minutes
      form.reset(); // Reset form after resend
      // Optionally reset the timer on resend
      setTimer(30);
      setCanResend(false);
    } catch (err) {
      toast.error("Failed to resend OTP");
      setResendStatus("idle");
    }
  };

  return (
    <Form {...form}>
      <div className="mb-2 flex items-center gap-1">
        <p className="text-muted-foreground text-sm">
          OTP sent to <span className="font-semibold">+91-{mobileNumber}</span>
        </p>
        <Button variant="link" className="text-primary px-1" onClick={onEdit}>
          <PencilIcon className="h-3 w-3" /> Edit
        </Button>
      </div>

      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data.otp))}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter One Time Password (OTP)</FormLabel>
              <FormControl>
                <Controller
                  name={field.name}
                  control={form.control}
                  render={({ field: { value, onChange } }) => (
                    <OTPInput value={value} onChange={onChange} length={6} />
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-muted-foreground text-xs">
          Your OTP will expire in <span className="font-semibold">{formatTime(expiryTimer)}</span> seconds.
        </p>
        <div className="grid grid-cols-[1fr_2fr] items-center justify-between gap-4">
          <div className="text-muted-foreground text-sm">
            {canResend || hasResentOnce ? (
              <Button
                type="button"
                variant="outline"
                className="text-primary w-full"
                onClick={handleResend}
                disabled={resendStatus === "done" || resendStatus === "sending"}
              >
                {resendStatus === "sending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending OTP
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            ) : (
              <span className="text-primary/80 text-xs">
                Resend OTP in {timer} seconds...
              </span>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying OTP
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
