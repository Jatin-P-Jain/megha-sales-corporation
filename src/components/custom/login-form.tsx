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
import { useAuth } from "@/context/auth";
import GoogleLoginButton from "@/components/custom/google-login-button";
import { useState } from "react";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { ConfirmationResult } from "firebase/auth";
import OTPInput from "./otp-input";
import CollapsibleLoginForm from "./collapsible-login-form";
import { useRouter } from "next/navigation";

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const router = useRouter();
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
      const confirmation = await auth?.handleSendOTP(data, appVerifier);
      setOtpSent(true);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully", {
        description: "Otp has been sent to your mobile number. Please check.",
      });
    } catch (e: unknown) {
      console.log({ e });
    }
  };
  const handleVerifyOTP = async (data: { otp: string }) => {
    try {
      const user = await auth?.verifyOTP(data, confirmationResult);
      if (user?.displayName) {
        console.log("User already exists");
        onSuccess?.();
      } else {
        console.log("User does not exist");

        router.push("/get-user-details");
      }
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
                      <Controller
                        name={field.name}
                        control={mobileOtpForm.control}
                        render={({ field: { value, onChange } }) => (
                          <OTPInput
                            value={value}
                            onChange={onChange}
                            length={6}
                          />
                        )}
                      />
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
      <GoogleLoginButton
        variant={"outline"}
        onSuccess={onSuccess}
        className=""
      />
      <span className="w-full flex justify-center text-zinc-500 text-[14px] my-4">
        or
      </span>
      <CollapsibleLoginForm />
      <div className="flex gap-2 justify-center items-center mt-4 text-xs md:text-sm">
        Don&apos;t have an account?
        <Link href={"/register"} className="text-cyan-900 underline">
          Register here.
        </Link>
      </div>
    </div>
  );
}
