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
import Link from "next/link";
import { RecaptchaVerifier } from "firebase/auth";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import { toast } from "sonner";

export function OtpVerificationForm({
  mobileNumber,
  isVerifying,
  recaptchaVerifier,
  onSuccess,
  onSubmit,
}: {
  mobileNumber: string;
  isVerifying: boolean;
  recaptchaVerifier: RecaptchaVerifier | null;
  onSuccess?: () => void;
  onSubmit: (otp: string) => void;
}) {
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
      await sendOtp(mobileNumber);
      setResendStatus("done");
      setHasResentOnce(true);
      toast.success("OTP resent successfully");

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
          OTP sent to <strong>+91-{mobileNumber}</strong>
        </p>
        <Button variant="link" asChild className="text-primary px-1">
          <Link href="/login" className="flex items-center gap-1 text-sm">
            <PencilIcon className="h-3 w-3" /> Edit
          </Link>
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

        <div className="grid grid-cols-[1fr_2fr] items-center justify-between gap-4">
          <div className="text-muted-foreground text-sm">
            {resendStatus === "done" ? (
              <span className="text-green-600">OTP resent successfully ✅</span>
            ) : canResend && !hasResentOnce ? (
              <Button
                type="button"
                variant="outline"
                className="text-primary w-full"
                onClick={handleResend}
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
