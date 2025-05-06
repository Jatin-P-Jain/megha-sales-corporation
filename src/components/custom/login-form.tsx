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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  loginUserMobileSchema,
  loginUserSchema,
  mobileOtpSchema,
} from "@/validation/loginUser";

import Link from "next/link";
import { useAuth } from "@/context/auth";
import GoogleLoginButton from "@/components/custom/google-login-button";
import { useState } from "react";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { ConfirmationResult } from "firebase/auth";

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  useRecaptcha();
  const [otpSent, setOtpSent] = useState(false);
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
  const form = useForm<z.infer<typeof loginUserSchema>>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const handleMobileSubmit = async (
    data: z.infer<typeof loginUserMobileSchema>
  ) => {
    const validation = loginUserMobileSchema.safeParse(data);
    console.log({ validation });

    if (!validation.success) {
      return {
        error: true,
        message: validation.error.issues[0]?.message ?? "An Error Occurred",
      };
    }
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      console.error("AppVerifier not ready");
      return;
    }
    try {
      const phoneRes = await fetch("/api/user/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data?.mobile }),
      });
      const { exists } = await phoneRes.json();
      if (exists) {
        const confirmation = await auth?.handleSendOTP(data, appVerifier);
        setOtpSent(true);
        setConfirmationResult(confirmation);
        toast.success("OTP sent successfully", {
          description: "Otp has been sent to your mobile number. Please check.",
        });
      } else {
        mobileForm.setError("mobile", {
          type: "manual",
          message:
            "No account found for this mobile number. Please REGISTER to continue.",
        });
      }
    } catch (e: unknown) {
      console.log({ e });
      if ((e as { code?: string }).code === "auth/user-not-found") {
        mobileForm.setError("mobile", {
          type: "manual",
          message: "No account exists with this mobile number.",
        });
      } else {
        toast.error("Error!", {
          description:
            "There is no user record corresponding to the provided identifier.",
        });
      }
    }
  };
  const handleVerifyOTP = async (data: { otp: string }) => {
    console.log(data.otp);
    console.log({ confirmationResult });
    try {
      await auth?.verifyOTP(data, confirmationResult);
      onSuccess?.();
    } catch (e: unknown) {
      console.log({ e });
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
    }
  };

  const handleSubmit = async (data: z.infer<typeof loginUserSchema>) => {
    const validation = loginUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        error: true,
        message: validation.error.issues[0]?.message ?? "An Error Occurred",
      };
    }

    try {
      await auth?.loginWithEmailAndPassword(data);
      onSuccess?.();
    } catch (e: unknown) {
      console.log({ e });

      toast.error("Error!", {
        description:
          (e as { code?: string })?.code === "auth/invalid-credential"
            ? "Invalid Credential"
            : "An error occurred",
      });
    }
  };
  return (
    <div>
      {otpSent ? (
        <Form {...mobileOtpForm}>
          <form
            onSubmit={mobileOtpForm.handleSubmit(handleVerifyOTP)}
            className="flex flex-col gap-5"
          >
            <FormField
              control={mobileOtpForm.control}
              name="otp"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Enter the One Time Password</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Otp here" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <Button
              type="submit"
              className="w-full tracking-wide cursor-pointer"
            >
              Verify OTP
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...mobileForm}>
          <form onSubmit={mobileForm.handleSubmit(handleMobileSubmit)}>
            <fieldset
              className="flex flex-col gap-5"
              disabled={mobileForm.formState.isSubmitting}
            >
              <FormField
                control={mobileForm.control}
                name="mobile"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Your Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mobile Number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <Button
                type="submit"
                className="w-full tracking-wide cursor-pointer"
              >
                Login with OTP
              </Button>
            </fieldset>
          </form>
        </Form>
      )}
      <span className="w-full flex justify-center text-zinc-500 text-[14px] my-4">
        or
      </span>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <fieldset
            className="flex flex-col gap-5"
            disabled={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your Password"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex gap-2 items-center text-sm">
                      Forgot your password?
                      <Link
                        href={"/forgot-password"}
                        className="text-sky-900 underline"
                      >
                        Reset it here.
                      </Link>
                    </div>
                  </FormItem>
                );
              }}
            />
            <Button
              type="submit"
              className="w-full uppercase tracking-wide cursor-pointer"
            >
              Login
            </Button>
          </fieldset>
        </form>
      </Form>
      <span className="w-full flex justify-center text-zinc-500 text-[14px] my-4">
        or
      </span>
      <GoogleLoginButton variant={"outline"} onSuccess={onSuccess} />
      <div className="flex gap-2 justify-center items-center mt-4 text-sm">
        Don&apos;t have an account?
        <Link href={"/register"} className="text-sky-900 underline">
          Register here.
        </Link>
      </div>
    </div>
  );
}
