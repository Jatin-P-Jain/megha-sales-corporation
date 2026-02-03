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
import {
  CheckCircle2,
  CloudDownload,
  Loader2,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import OTPInput from "@/components/custom/otp-input";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";
import { updateUserProfile } from "./action";
import { DecodedIdToken } from "firebase-admin/auth";
import GoogleIcon from "@/components/custom/google-icon.svg";
import Image from "next/image";
import { GoogleAuthProvider, linkWithPopup } from "firebase/auth";
import { setToken } from "@/context/actions";
import { GstDetails } from "@/components/custom/gst-details";
import { GstDetailsData } from "@/data/businessProfile";

export default function ProfileForm({
  defaultValues,
  verifiedToken,
}: {
  defaultValues?: z.infer<typeof userProfileDataSchema>;
  verifiedToken: DecodedIdToken | null;
}) {
  const auth = useAuth();
  const user = auth.currentUser;
  const recaptchaVerifier = useRecaptcha();
  const [isVerified, setIsVerified] = useState(
    !!defaultValues?.phone ? true : false,
  );
  const [isAccountLinking, setIsAccountLinking] = useState(false);
  const [gstDetails, setGstDetails] = useState<GstDetailsData | null>(null);
  const [loadingGst, setLoadingGst] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  const { otpReset, otpSent, sendingOtp, isVerifying, sendOtp, verifyOtp } =
    useMobileOtp({
      onSuccess: () => {
        setIsVerified(true);
        toast.success("Phone number verified!", {
          description:
            "Phone number verified and linked to your account successfully.",
        });
      },
      appVerifier: recaptchaVerifier,
      isProfile: true,
    });

  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues,
  });

  const selectedRole = form.watch("role");
  const phoneNumber = form.watch("phone");
  const otp = form.watch("otp");

  useEffect(() => {
    if (otpReset) {
      form.resetField("otp");
    }
  }, [otpReset, form]);

  const isPhoneAuthProvider =
    verifiedToken?.firebase["sign_in_provider"] === "phone";

  useEffect(() => {
    if (loginUserMobileSchema.safeParse({ mobile: phoneNumber }).success) {
      setIsPhoneValid(true);
    } else {
      setIsPhoneValid(false);
    }
  }, [phoneNumber]);

  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const handleLinkGoogle = async () => {
    setIsAccountLinking(true);
    if (!user) {
      setIsAccountLinking(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await linkWithPopup(user, provider);
      await user.reload();

      // ✅ CHANGED: Don't force refresh, just get current token
      const freshToken = await user.getIdToken(false);
      await setToken(freshToken, user.refreshToken);

      form.setValue("email", result.user.email ?? "");
      toast.success("Success!", {
        description:
          "Your Google account linked! You can now sign in with Google moving forward.",
      });
      setIsAccountLinking(false);
    } catch (err: unknown) {
      console.log("err --", err);
      setIsAccountLinking(false);
      if ((err as { code: string }).code === "auth/credential-already-in-use") {
        toast.error("Error!", {
          description: "This Google account is already linked to another user.",
        });
      } else {
        toast.error("An error occurred while linking google account");
      }
    }
  };

  const gstNumber = form.watch("gstNumber");

  const fetchGstDetails = async (gstin: string) => {
    setLoadingGst(true);
    setGstError(null);
    try {
      const res = await fetch(`/api/gst-lookup?gstin=${gstin}`);
      const data = await res.json();
      if (data.flag !== true) {
        setGstError("Invalid GSTIN or no data found");
        setGstDetails(null);
      } else {
        setGstDetails(data);
      }
    } catch (err: unknown) {
      setGstError("Failed to fetch GST details");
      setGstDetails(null);
      console.error("GST fetch error:", err);
    } finally {
      setLoadingGst(false);
    }
  };

  const handleSubmit = async (data: z.infer<typeof userProfileSchema>) => {
    try {
      delete data.otp;
      const { otherUserRole, ...rest } = data;

      const finalRole =
        data.role === "other" && otherUserRole ? otherUserRole : data.role;

      const businessProfile =
        gstDetails?.flag === true
          ? {
              gstin: gstDetails.data.gstin,
              legalName: gstDetails.data.lgnm,
              tradeName: gstDetails.data.tradeNam,
              address: gstDetails.data.pradr?.adr || "",
              status: gstDetails.data.sts,
              registrationDate: gstDetails.data.rgdt,
              natureOfBusiness: gstDetails.data.nba || [],
              constitutionType: gstDetails.data.ctb,
              jurisdiction: gstDetails.data.ctj,
              verified: true,
              verifiedAt: new Date().toISOString(),
              verifieddata: gstDetails.data,
            }
          : null;

      await updateUserProfile(
        {
          ...rest,
          role: finalRole,
          businessProfile,
        },
        verifiedToken,
      );

      // Refresh client user from DB
      await auth.refreshClientUser();

      // ✅ Use client-side navigation instead of window.location.assign
      // This prevents the auth state from being cleared
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      toast.success("Success!", {
        description: "Your profile has been saved successfully!",
      });
    } catch (err: unknown) {
      console.error("Profile Submit error:", err);
      if (err instanceof Error) {
        toast.error(err.message || "Failed to update profile");
      } else {
        toast.error("Failed to update profile");
      }
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <>
      <div className="relative">
        {auth.loading && (
          <div className="absolute top-0 z-30 flex h-full w-full items-center justify-center gap-2 bg-zinc-400/10">
            <div className="flex h-1/8 w-3/4 items-center justify-center gap-2 rounded-lg border-1 bg-white">
              <Loader2 className="animate-spin" />
              Fetching your profile...
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSubmit(data))}>
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

              <div className="flex flex-col">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => {
                    return (
                      <FormItem className="">
                        <FormLabel className="flex w-1/4 items-start gap-1">
                          Your email
                          <span className="text-muted-foreground text-xs">
                            *
                          </span>
                        </FormLabel>
                        <div className="flex w-full flex-col-reverse items-center justify-center md:flex-row-reverse">
                          {isPhoneAuthProvider && !defaultValues?.email && (
                            <>
                              <Button
                                type="button"
                                className="mx-auto w-full cursor-pointer rounded-full text-[14px] shadow-md md:w-fit"
                                variant={"outline"}
                                onClick={handleLinkGoogle}
                              >
                                {isAccountLinking ? (
                                  <>
                                    <Loader2Icon className="size-4 animate-spin" />
                                    Linking Google Account
                                  </>
                                ) : (
                                  <>
                                    <Image
                                      src={GoogleIcon}
                                      alt=""
                                      width={25}
                                      height={25}
                                    />
                                    Link Google Account
                                  </>
                                )}
                              </Button>
                              <span className="m-2 flex justify-center text-[14px] text-zinc-500 md:mx-4">
                                or
                              </span>
                            </>
                          )}
                          <FormControl className="w-full">
                            <Input
                              {...field}
                              placeholder="Your email"
                              readOnly={!!defaultValues?.email}
                              className={clsx(
                                defaultValues?.email && "w-full font-semibold",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    );
                  }}
                />
                {!isPhoneAuthProvider && !defaultValues?.email && (
                  <span className="mt-1 text-xs text-yellow-700">
                    This email (Google Account) will be linked to your account.
                    You will be able to log in using it in the future.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div
                  className={clsx(
                    !otpSent &&
                      !isVerified &&
                      "flex w-full items-center justify-center gap-2",
                  )}
                >
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="flex items-start gap-1">
                          Your mobile number
                          <span className="text-xs">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex w-full gap-2">
                            <Input
                              {...field}
                              placeholder="Mobile Number"
                              readOnly={!!defaultValues?.phone || otpSent}
                              className={clsx(
                                !!defaultValues?.phone && "font-semibold",
                              )}
                            />
                            {!otpSent && !isVerified && (
                              <Button
                                disabled={!isPhoneValid}
                                type="button"
                                className=""
                                onClick={() => sendOtp(phoneNumber)}
                              >
                                {sendingOtp ? (
                                  <>
                                    <Loader2 className="size-4 animate-spin" />{" "}
                                    Sending OTP
                                  </>
                                ) : (
                                  "Verify"
                                )}
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    {!isPhoneAuthProvider ? "Verified & Linked" : "Verified"}
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
                    disabled={isVerifying}
                    type="button"
                    className="w-full"
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
                            placeholder="Specify your role or business type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>GSTIN Number</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2 md:flex-row">
                          <Input
                            {...field}
                            placeholder="Enter 15-digit GSTIN"
                            className={clsx(
                              gstDetails &&
                                "border-green-300 ring-1 ring-green-200",
                              !gstDetails &&
                                gstNumber?.length === 15 &&
                                "border-orange-300",
                            )}
                          />
                          {!loadingGst && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fetchGstDetails(gstNumber || "")}
                              disabled={
                                gstNumber?.length !== 15 ||
                                loadingGst ||
                                isSubmitting
                              }
                              className="gap-2"
                            >
                              <span>Get Details</span>
                              {loadingGst ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CloudDownload className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </FormControl>

                      {loadingGst && (
                        <div className="mt-3">
                          <GstDetails data={null} loading={true} />
                        </div>
                      )}
                      {gstDetails && (
                        <div className="mt-3">
                          <GstDetails data={gstDetails} loading={false} />
                        </div>
                      )}
                      {gstError && (
                        <div className="text-destructive">{gstError}</div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <Button
                disabled={
                  !isVerified ||
                  isSubmitting ||
                  loadingGst ||
                  !form.formState.isValid ||
                  gstDetails === null
                }
                type="submit"
                className="w-full cursor-pointer tracking-wide uppercase"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
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
        <div id="recaptcha-container" className="opacity-0" />
      </div>
    </>
  );
}
