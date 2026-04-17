// app/login/mobile-auth/mobile-auth-wrapper.tsx
"use client";

import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  CheckCircle,
  Loader2,
  LogIn,
  PencilIcon,
  Repeat,
  Smartphone,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import OTPInput from "@/components/custom/otp-input";
import { loginUserMobileSchema, mobileOtpSchema } from "@/validation/loginUser";
import { formatTime } from "@/lib/utils";
import clsx from "clsx";

const schema = z.object({
  mobile: loginUserMobileSchema.shape.mobile,
  otp: mobileOtpSchema.shape.otp.optional(),
});

type Values = z.infer<typeof schema>;

export function MobileAuthWrapper({ onSuccess }: { onSuccess?: () => void }) {
  const recaptcha = useRecaptcha({ enabled: true });
  const recaptchaVerifier = recaptcha.verifier;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: "", otp: "" },
    mode: "onSubmit",
  });

  const mobile = form.watch("mobile");
  const otp = form.watch("otp");

  const {
    otpSent,
    sendingOtp,
    isVerifying,
    sendOtp,
    verifyOtp,
    resetOtp,

    resendIn,
    resendOtp,
    editMobile,
    lockMobileInput,
  } = useMobileOtp({
    onSuccess: () => {
      resetOtp();
      form.reset({ mobile: "", otp: "" });
      onSuccess?.();
    },
    appVerifier: recaptchaVerifier,
    ensureRecaptcha: recaptcha.ensureReady,
    resetRecaptcha: recaptcha.reset,
    resendSeconds: 30,
  });

  // OTP expiry timer (same as you had: 5 min)
  const [expiryTimer, setExpiryTimer] = useState(300);
  useEffect(() => {
    if (!otpSent) {
      setExpiryTimer(300);
      return;
    }

    const interval = window.setInterval(() => {
      setExpiryTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [otpSent]);

  return (
    <Form {...form}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          if (!otpSent) {
            // Step 1: Send OTP
            const ok = await form.trigger("mobile");
            if (!ok) return;

            await sendOtp(mobile);
            return;
          }
          const ok = await form.trigger("otp");
          if (!ok) return;

          await verifyOtp((otp ?? "").trim());
        }}
      >
        <fieldset
          className="flex flex-col gap-5"
          disabled={form.formState.isSubmitting}
        >
          {/* Mobile input (always shown) */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Your Mobile Number{" "}
                  <Smartphone className="inline-block size-4" />
                </FormLabel>
                <FormControl>
                  <div className="flex w-full flex-col items-center gap-2">
                    <div className="flex w-full items-center justify-center gap-2 md:gap-4">
                      <Input
                        {...field}
                        placeholder="Mobile Number"
                        inputMode="numeric"
                        maxLength={10}
                        readOnly={lockMobileInput}
                        className={clsx(
                          "w-full",
                          lockMobileInput ? "font-semibold" : "",
                        )}
                        onChange={(e) => {
                          if (!isNaN(Number(e.target.value))) field.onChange(e);
                        }}
                      />
                      {otpSent && (
                        <>
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => {
                              // reset hook state
                              editMobile();
                              // reset form otp field + allow editing phone again
                              form.resetField("otp");
                            }}
                          >
                            <PencilIcon className="size-4" />{" "}
                            <span className="hidden md:inline-flex">
                              Edit Mobile Number
                            </span>
                          </Button>
                        </>
                      )}
                    </div>
                    {/* Send OTP button (visible only before otpSent) */}
                    {!otpSent && (
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? (
                          <>
                            <Loader2 className="animate-spin" />
                            Sending OTP
                          </>
                        ) : (
                          <>
                            <LogIn className="" />
                            Login with OTP
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* OTP section (appears in-place after otpSent) */}
          {otpSent && (
            <>
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
                          <OTPInput
                            value={value ?? ""}
                            onChange={onChange}
                            length={6}
                            onComplete={(code) => {
                              if (!isVerifying) void verifyOtp(code.trim());
                            }}
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-muted-foreground text-xs">
                Your OTP will expire in{" "}
                <span className="font-semibold">{formatTime(expiryTimer)}</span>{" "}
                seconds.
              </p>

              <div className="grid grid-cols-[1fr_2fr] items-center justify-between gap-4">
                <div className="text-muted-foreground text-sm">
                  {resendIn === 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-primary w-full"
                      onClick={async () => {
                        await resendOtp();
                        setExpiryTimer(300);
                        form.setValue("otp", "");
                      }}
                      disabled={sendingOtp || isVerifying}
                    >
                      {sendingOtp ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Resending OTP
                        </>
                      ) : (
                        <>
                          <Repeat className="size-4" />
                          Resend OTP
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-primary/80 text-xs">
                      Resend OTP in {resendIn}s
                    </span>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Verifying OTP
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-4" /> Verifying OTP
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </fieldset>
      </form>
    </Form>
  );
}
