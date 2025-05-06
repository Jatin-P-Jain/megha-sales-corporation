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
import {
  mobileOtpSchema,
  registerUserPhoneSchema,
} from "@/validation/registerUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerUserWithPhone } from "./action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import { useState } from "react";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

export default function RegisterPhoneForm() {
  const auth = useAuth();
  const router = useRouter();
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<
    ConfirmationResult | undefined
  >(undefined);
  const [otpVerified, setOtpVerified] = useState(false);

  const form = useForm<z.infer<typeof registerUserPhoneSchema>>({
    resolver: zodResolver(registerUserPhoneSchema),
    defaultValues: {
      email: "",
      name: "",
      mobile: "",
    },
  });
  const registerMobileOtpForm = useForm<z.infer<typeof mobileOtpSchema>>({
    resolver: zodResolver(mobileOtpSchema),
    defaultValues: {
      otp: "",
    },
  });
  const handleSendOTP = async (
    data: { mobile: string },
    appVerifier: RecaptchaVerifier
  ) => {
    try {
      const confirmation = await auth?.handleSendOTP(data, appVerifier);
      setOtpSent(true);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully", {
        description: "Otp has been sent to your mobile number. Please check.",
      });
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

  const handleVerifyOTP = async (data: { otp: string; name?: string }) => {
    try {
      await auth?.verifyOTP(data, confirmationResult);
      setOtpVerified(true);
      toast.success("OTP verified successfully", {
        description: "Your mobile number has been verified successfully.",
      });
    } catch (e: unknown) {
      console.log({ e });
      registerMobileOtpForm.setError("otp", {
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
  const registerUser = async (
    data: z.infer<typeof registerUserPhoneSchema>
  ) => {
    const validation = registerUserPhoneSchema.safeParse(data);
    if (!validation.success) {
      return {
        error: true,
        message: validation.error.issues[0]?.message ?? "An Error Occurred",
      };
    }
    const phoneRes = await fetch("/api/user/check-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: data?.mobile }),
    });

    const { exists: phoneExists } = await phoneRes.json();
    const emailRes = await fetch("/api/user/check-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: data?.mobile }),
    });

    const { exists: emailExists } = await emailRes.json();

    if (!phoneExists && !emailExists) {
      try {
        const response = await registerUserWithPhone(data);
        if (!!response?.error) {
          toast.error("Error!", { description: response.message });
        } else {
          toast.success("Success!", {
            description: "Your account has been created successfully!",
          });
          router.push("/login");
        }
      } catch (e) {
        console.log({ e });
        toast.error("Error!", {
          description:
            (e as { code?: string })?.code === "auth/invalid-credential"
              ? "Invalid Credential"
              : "An error occurred",
        });
      }
    } else if (phoneExists) {
      form.setError("mobile", {
        type: "manual",
        message:
          "The mobile number you entered is not associated with any account.\nPlease register.",
      });
    } else if (emailExists) {
      form.setError("email", {
        type: "manual",
        message:
          "The email address you entered is already associated with an account.\nPlease login.",
      });
    } else {
    }
  };
  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={
            otpVerified
              ? form.handleSubmit(registerUser)
              : otpSent
              ? registerMobileOtpForm.handleSubmit((data) =>
                  handleVerifyOTP({ ...data, name: form.getValues("name") })
                )
              : form.handleSubmit((data) => {
                  const appVerifier = window.recaptchaVerifier;
                  if (!appVerifier) {
                    console.error("AppVerifier not ready");
                    return;
                  }
                  handleSendOTP({ mobile: data.mobile }, appVerifier);
                })
          }
        >
          <fieldset
            className="flex flex-col gap-5"
            disabled={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Email (Optional)</FormLabel>
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
              name="mobile"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Mobile Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your mobile number" />
                    </FormControl>
                    <FormMessage />
                    {otpVerified && (
                      <p className="text-green-600 text-sm mt-1">
                        Mobile number verified ✅
                      </p>
                    )}
                  </FormItem>
                );
              }}
            />
            {otpSent && !otpVerified && (
              <FormField
                control={registerMobileOtpForm.control}
                name="otp"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter OTP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}
            <Button
              type="submit"
              className="w-full uppercase tracking-wide cursor-pointer"
            >
              {otpVerified
                ? "Register"
                : otpSent
                ? "Verify OTP"
                : "Register with OTP"}
            </Button>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
