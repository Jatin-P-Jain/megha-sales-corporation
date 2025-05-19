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
import {
  userProfileDataSchema,
  userProfileSchema,
} from "@/validation/profileSchema";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { loginUserMobileSchema } from "@/validation/loginUser";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Loader2Icon, SaveIcon } from "lucide-react";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import OTPInput from "@/components/custom/otp-input";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";
import { updateUserProfile } from "./action";
import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "firebase/auth";

export default function ProfileForm({
  defaultValues,
  verifiedToken,
}: {
  defaultValues?: z.infer<typeof userProfileDataSchema>;
  verifiedToken: DecodedIdToken | null;
}) {
  // console.log({ defaultValues });
  const auth = useAuth();
  const router = useRouter();
  const recaptchaVerifier = useRecaptcha();
  const [isVerified, setIsVerified] = useState(
    !!defaultValues?.phone ? true : false,
  );

  const { otpSent, sendingOtp, isVerifying, sendOtp, verifyOtp } = useMobileOtp(
    {
      onSuccess: () => {
        setIsVerified(true);
        toast.success("Phone number verified!", {
          description:
            "Phone number verified and linked to your accounf successfully.",
        });
      },
      appVerifier: recaptchaVerifier,
      isProfile: true,
    },
  );
  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues,
  });
  const selectedRole = form.watch("role");
  const phoneNumber = form.watch("phone");
  const otp = form.watch("otp");

  useEffect(() => {
    if (loginUserMobileSchema.safeParse({ mobile: phoneNumber }).success) {
      setIsPhoneValid(true);
    } else {
      setIsPhoneValid(false);
    }
  }, [phoneNumber]);

  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const handleSubmit = async (
    data: z.infer<typeof userProfileSchema>,
    currentUser: User | null,
  ) => {
    console.log({ data });
    delete data.otp;
    const { otherUserRole, ...rest } = data;

    const finalRole =
      data.role === "other" && otherUserRole ? otherUserRole : data.role;
    if (currentUser) {
      const token = await currentUser.getIdToken(true); // Get a fresh ID token
      const refreshToken = currentUser.refreshToken;
      const response = await updateUserProfile(
        { ...rest, role: finalRole },
        verifiedToken,
      );
      if (!!response?.error) {
        toast.error("Error!", { description: response.message });
      } else {
        toast.success("Success!", {
          description: "Your profile has been saved successfully!",
        });
        router.push("/");
      }
    } else {
      toast.error("Error!", { description: "Not logged in user." });
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <>
      <div className="relative">
        {auth.loading && (
          <div className="absolute top-0 flex h-full w-full items-center justify-center gap-2 bg-zinc-400/10">
            <div className="flex h-1/8 w-3/4 items-center justify-center gap-2 rounded-lg border-1 bg-white">
              <Loader2 className="animate-spin" />
              Fetching your profile...
            </div>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              handleSubmit(data, auth.currentUser),
            )}
          >
            <fieldset
              className="flex flex-col gap-5"
              disabled={form.formState.isSubmitting}
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel className="flex items-start gap-1">
                        Your Name
                        <span className="text-muted-foreground text-xs">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Name"
                          readOnly={!!defaultValues?.displayName}
                          className={clsx(
                            defaultValues?.displayName && "font-semibold",
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="firmName"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Your Firm Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Shop or Firm Name" />
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
                      <FormLabel className="flex items-start gap-1">
                        Your email
                        <span className="text-muted-foreground text-xs">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Email"
                          readOnly={!!defaultValues?.email}
                          className={clsx(
                            defaultValues?.email && "font-semibold",
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <div className="flex flex-col gap-2">
                <div
                  className={clsx(
                    isPhoneValid &&
                      !otpSent &&
                      !isVerified &&
                      "grid grid-cols-[8fr_1fr] items-end justify-center gap-2",
                  )}
                >
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-start gap-1">
                          Your mobile number
                          <span className="text-muted-foreground text-xs">
                            *
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Mobile Number"
                            readOnly={!!defaultValues?.phone || otpSent}
                            className={clsx(
                              !!defaultValues?.phone && "font-semibold",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isPhoneValid && !otpSent && !isVerified && (
                    <Button
                      type="button"
                      className="self-end"
                      onClick={() => sendOtp(phoneNumber)}
                    >
                      {sendingOtp ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Sending
                          OTP
                        </>
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  )}
                </div>
                {!defaultValues?.phone && !isVerified && (
                  <span className="mt-1 text-xs text-yellow-700">
                    This mobile number will be linked to your account. You will
                    be able to log in using it in the future.
                  </span>
                )}
                {isVerified && (
                  <div className="flex w-fit gap-1 rounded-lg bg-green-200 p-1 px-3 text-xs font-semibold text-green-800">
                    <CheckCircle2 className="size-4 text-green-800" />
                    Verified & Linked
                  </div>
                )}
              </div>
              {otpSent && !isVerified && (
                <div className="grid grid-cols-1 items-end justify-center gap-4 md:grid-cols-[8fr_1fr] md:gap-4">
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-start gap-1">
                          Enter OTP
                          <span className="text-muted-foreground text-xs">
                            *
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Controller
                            name={field.name}
                            control={form.control}
                            render={({ field: { value, onChange } }) => (
                              <OTPInput
                                value={value ?? ""}
                                onChange={onChange}
                                length={6}
                              />
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    className="w-full"
                    variant={"outline"}
                    onClick={() => verifyOtp(otp ?? "")}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Verifying OTP
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                </div>
              )}
              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-start gap-1">
                      Your role or business type
                      <span className="text-muted-foreground text-xs">*</span>
                    </FormLabel>
                    {selectedRole === "admin" && (
                      <span className="text-xs text-green-700">
                        You are an admin.
                      </span>
                    )}
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={field.value === "admin"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role">
                            {field.value === "admin" ? "Admin" : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="wholesaler">Wholesaler</SelectItem>
                          <SelectItem value="distributor">
                            Distributor
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedRole === "other" && (
                <FormField
                  control={form.control}
                  name="otherUserRole"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Specify your role or bussiness type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
              <Button
                disabled={!isVerified}
                type="submit"
                className="w-full cursor-pointer tracking-wide uppercase"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4" />
                    Saving Profile
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </fieldset>
          </form>
        </Form>
        <div id="recaptcha-container" className="opacity-100" />
      </div>
    </>
  );
}
