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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { loginUserMobileSchema, mobileOtpSchema } from "@/validation/loginUser";

import Link from "next/link";
import { useAuth } from "@/context/useAuth";
import GoogleLoginButton from "@/components/custom/google-login-button";
import { useState } from "react";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { ConfirmationResult } from "firebase/auth";
import OTPInput from "./otp-input";
import CollapsibleLoginForm from "./collapsible-login-form";
import { Loader2 } from "lucide-react";

function OtpVerificationForm({
  form,
  onSubmit,
  isVerifying,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof mobileOtpSchema>>>;
  onSubmit: (data: { otp: string }) => void;
  isVerifying: boolean;
}) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter the One Time Password</FormLabel>
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
        <Button type="submit" className="w-full cursor-pointer tracking-wide">
          {isVerifying ? (
            <>
              <Loader2 className="animate-spin" />
              Verifying OTP
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </form>
    </Form>
  );
}

function MobileLoginForm({
  form,
  onSubmit,
  sendingOtp,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof loginUserMobileSchema>>>;
  onSubmit: (data: z.infer<typeof loginUserMobileSchema>) => void;
  sendingOtp: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          className="flex flex-col gap-5"
          disabled={form.formState.isSubmitting}
        >
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Mobile Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mobile Number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full cursor-pointer tracking-wide">
            {sendingOtp ? (
              <>
                <Loader2 className="animate-spin" />
                Sending OTP
              </>
            ) : (
              "Login with OTP"
            )}
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  useRecaptcha();
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<
    ConfirmationResult | undefined
  >(undefined);

  const mobileForm = useForm<z.infer<typeof loginUserMobileSchema>>({
    resolver: zodResolver(loginUserMobileSchema),
    defaultValues: {
      mobile: "",
    },
  });

  const mobileOtpForm = useForm<z.infer<typeof mobileOtpSchema>>({
    resolver: zodResolver(mobileOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleMobileSubmit = async (
    data: z.infer<typeof loginUserMobileSchema>,
  ) => {
    const validation = loginUserMobileSchema.safeParse(data);
    if (!validation.success) {
      return;
    }
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      console.error("AppVerifier not ready");

      return;
    }
    try {
      setSendingOtp(true);
      const confirmation = await auth?.handleSendOTP(data.mobile, appVerifier);
      setOtpSent(true);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully", {
        description: "Otp has been sent to your mobile number. Please check.",
      });
      setSendingOtp(false);
    } catch (e: unknown) {
      console.error(e);
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (data: { otp: string }) => {
    setIsVerifying(true);
    try {
      if (!confirmationResult)
        throw new Error("Confirmation result is undefined.");
      await auth?.verifyOTP(data.otp, confirmationResult);
      onSuccess?.();
      setIsVerifying(false);
    } catch (e: unknown) {
      console.error(e);
      mobileOtpForm.setError("otp", {
        type: "manual",
        message:
          (e as { code?: string })?.code === "auth/invalid-verification-code"
            ? "Invalid OTP"
            : "An error occurred during verification.",
      });
      toast.error("Error!", {
        description:
          (e as { code?: string })?.code === "auth/invalid-credential"
            ? "Invalid credential. Please try again."
            : (e as { code?: string })?.code ===
                "auth/invalid-verification-code"
              ? "Invalid OTP. Try again!"
              : "An unexpected error occurred.",
      });
      setIsVerifying(false);
    }
  };

  return (
    <div>
      {otpSent ? (
        <OtpVerificationForm
          form={mobileOtpForm}
          onSubmit={handleVerifyOTP}
          isVerifying={isVerifying}
        />
      ) : (
        <MobileLoginForm
          form={mobileForm}
          onSubmit={handleMobileSubmit}
          sendingOtp={sendingOtp}
        />
      )}

      <span className="my-4 flex w-full justify-center text-[14px] text-zinc-500">
        or
      </span>
      <GoogleLoginButton variant="outline" onSuccess={onSuccess} />
      <span className="my-4 flex w-full justify-center text-[14px] text-zinc-500">
        or
      </span>
      <CollapsibleLoginForm />
      <div className="mt-4 flex items-center justify-center gap-2 text-xs md:text-sm">
        Don&apos;t have an account?
        <Link href="/register" className="text-cyan-900 underline">
          Register here.
        </Link>
      </div>
      <div id="recaptcha-container" className="opacity-0" />
    </div>
  );
}
