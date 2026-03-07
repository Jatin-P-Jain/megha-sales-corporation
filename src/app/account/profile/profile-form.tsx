"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import clsx from "clsx";
import {
  CheckCircle2,
  CheckCircleIcon,
  CircleUserRound,
  CloudDownload,
  Info,
  Loader2,
  Loader2Icon,
  PencilIcon,
  Repeat,
  SaveIcon,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import OTPInput from "@/components/custom/otp-input";
import GoogleIcon from "@/components/custom/google-icon.svg";
import { GstDetails } from "@/components/custom/gst-details";
import ProfileCompleteAsk from "./profile-complete-ask";
import { formatBusinessProfile } from "@/lib/business-profile-formatter";

import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useLinkAuthProviders } from "@/hooks/useLinkAuthProviders";

import { setToken } from "@/context/actions";
import { useAuthState } from "@/context/useAuth";

import { updateUserProfile } from "./action";
import { updateUserFirebaseMethods } from "../actions";

import { userProfileSchema } from "@/validation/profileSchema";
import { loginUserMobileSchema } from "@/validation/loginUser";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import {
  useUserProfileActions,
  useUserProfileState,
} from "@/context/UserProfileProvider";
import { updateUserGate } from "@/lib/firebase/updateUserGate";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { GstDetailsData } from "@/types/user";

type FormValues = z.infer<typeof userProfileSchema>;

export default function ProfileForm() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useSafeRouter();

  useRequireUserProfile(true);

  const { currentUser, isAdmin, authLoading } = useAuthState();
  const { refreshUser } = useUserProfileActions();
  const { clientUser, clientUserLoading } = useUserProfileState();

  const pageLoading = authLoading || (currentUser ? clientUserLoading : false);

  const recaptchaVerifier = useRecaptcha({ enabled: true });

  const [isVerified, setIsVerified] = useState(false);
  const [isPhoneLinked, setIsPhoneLinked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [gstDetails, setGstDetails] = useState<GstDetailsData | null>(null);
  const [loadingGst, setLoadingGst] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  // Local UI state for GST vs PAN
  const [idType, setIdType] = useState<"pan" | "gst">("gst");

  const [didInit, setDidInit] = useState(false);

  const { linkGoogle, linkingGoogle } = useLinkAuthProviders({
    user: currentUser,
    recaptchaVerifier: recaptchaVerifier.verifier,
    onToken: async (idToken, refreshToken) => {
      await setToken(idToken, refreshToken);
    },
    onLinked: async ({ user }) => {
      const photoUrl = user?.providerData.find(
        (p) => p.providerId === "google.com",
      )?.photoURL;

      await updateUserFirebaseMethods(
        user?.email ?? undefined,
        photoUrl ?? undefined,
      );
      await refreshUser();
    },
    toast,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(userProfileSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldUnregister: true, // ✅ key for conditional GST/PAN fields
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      // keep selects controlled from day 1
      businessType: "",
      businessIdType: "gst",
      gstNumber: "",
      panNumber: "",
      firmName: "",
      photoUrl: "",
      otp: "",
      otherBusinessType: "",
    },
  });

  // Watch only what you need for conditional rendering + submit gating
  const displayName = useWatch({ control: form.control, name: "displayName" });
  const email = useWatch({ control: form.control, name: "email" });
  const selectedBusinessType = useWatch({
    control: form.control,
    name: "businessType",
  });
  const otherBusinessType = useWatch({
    control: form.control,
    name: "otherBusinessType",
  });
  const phoneNumber = useWatch({ control: form.control, name: "phone" });
  const otp = useWatch({ control: form.control, name: "otp" });
  const panNumber = useWatch({ control: form.control, name: "panNumber" });
  const firmName = useWatch({ control: form.control, name: "firmName" });

  const [isPhoneValid, setIsPhoneValid] = useState(false);
  useEffect(() => {
    setIsPhoneValid(
      loginUserMobileSchema.safeParse({ mobile: phoneNumber }).success,
    );
  }, [phoneNumber]);

  // Init defaults once when clientUser arrives
  useEffect(() => {
    if (!clientUser || didInit) return;

    const from = searchParams.get("from");
    if (from === "login") {
      setDialogOpen(true);

      const next = new URLSearchParams(searchParams.toString());
      next.delete("from");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }

    const nextDefaults: Partial<FormValues> = {
      displayName: clientUser.displayName || "",
      email: clientUser.email || "",
      phone: clientUser.phone || "",

      // keep controlled strings
      businessType: clientUser.businessType || "",
      businessIdType: (clientUser.businessProfile
        ? clientUser.businessProfile.gstin
          ? "gst"
          : "pan"
        : "gst") as "gst" | "pan",

      gstNumber: clientUser.businessProfile?.gstin || "",
      firmName: clientUser.firmName || "",
      panNumber: clientUser.panNumber || "",

      photoUrl: clientUser.photoUrl || "",
      otp: "",
      otherBusinessType: "",
    };

    form.reset(nextDefaults as FormValues);

    const initialIdType = (nextDefaults.businessIdType ?? "gst") as
      | "gst"
      | "pan";
    setIdType(initialIdType);

    setIsVerified(!!clientUser.phone);
    setIsPhoneLinked(
      !!clientUser.phone && (!!clientUser.email || !!clientUser.firebaseAuth),
    );
    setDidInit(true);
  }, [clientUser, didInit, form, pathname, router, searchParams]);

  useEffect(() => {
    if (!clientUser?.email) return;

    const current = form.getValues("email") || "";
    const next = clientUser.email || "";

    // Only patch if it's actually different (and don't overwrite while user is typing)
    if (current !== next && !form.getFieldState("email").isDirty) {
      form.setValue("email", next, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [clientUser?.email, form]);

  const {
    otpReset,
    otpSent,
    sendingOtp,
    isVerifying,
    sendOtp,
    verifyOtp,
    resendIn,
    resendOtp,
    editMobile,
    lockMobileInput,
  } = useMobileOtp({
    onSuccess: async () => {
      setIsVerified(true);
      setIsPhoneLinked(true);
      await updateUserProfile({ phone: phoneNumber });
      await refreshUser();
    },
    appVerifier: recaptchaVerifier.verifier,
    ensureRecaptcha: recaptchaVerifier.ensureReady,
    resetRecaptcha: recaptchaVerifier.reset,
    linkPhone: true,
    resendSeconds: 30,
  });

  useEffect(() => {
    if (otpReset) form.resetField("otp");
  }, [otpReset, form]);

  const fetchGstDetails = useCallback(async (gstin: string) => {
    const v = (gstin || "").trim();
    if (!v) return;

    setLoadingGst(true);
    setGstError(null);

    try {
      const res = await fetch(`/api/gst-lookup?gstin=${encodeURIComponent(v)}`);
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
  }, []);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const { otp: _otp, otherBusinessType, ...rest } = data;

        if (isAdmin) {
          await updateUserProfile({
            displayName: rest.displayName,
            email: rest.email,
            phone: rest.phone,
            photoUrl: rest.photoUrl,
            businessType: "",
            businessProfile: null,
          });
          await updateUserGate(true, "admin", "approved");
        } else {
          const finalBusinessType =
            rest.businessType === "other" && otherBusinessType
              ? otherBusinessType
              : rest.businessType;

          const businessProfile =
            idType === "gst" && gstDetails?.flag === true
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

          await updateUserProfile({
            ...rest,
            businessType: finalBusinessType,
            businessProfile,
          });
          await updateUserGate(true, "customer", "pending");
        }

        const freshClientUser = await refreshUser();

        if (freshClientUser) {
          await fetch("/api/wa-send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateKey: "account_approval_request_to_admin",
              customerUserId: freshClientUser.userId,
              customerName: freshClientUser.displayName || "User",
              customerPhone: freshClientUser.phone || "Not provided",
              customerEmail: freshClientUser.email || "Not provided",
              customerBusinessProfile: formatBusinessProfile(freshClientUser),
            }),
          });
        }

        toast.success("Success!", {
          description: "Your profile has been saved successfully!",
        });

        const redirect = searchParams.get("redirect") ?? "/";
        router.push(redirect);
      } catch (err: unknown) {
        console.error("Profile Submit error:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update profile",
        );
      }
    },
    [gstDetails, idType, isAdmin, refreshUser, router, searchParams],
  );

  const canSubmit = useMemo(() => {
    if (form.formState.isSubmitting) return false;
    if (!isVerified) return false;

    if (isAdmin) {
      return !!displayName?.trim() && !!email?.trim() && !!phoneNumber?.trim();
    }
    // businessType must be selected (default is "")
    if (!selectedBusinessType?.trim()) return false;

    // if "other", otherBusinessType must be provided
    if (selectedBusinessType === "other" && !otherBusinessType?.trim())
      return false;

    if (idType === "gst") {
      return !loadingGst && form.formState.isValid && gstDetails !== null;
    }
    const panOk = !!panNumber?.trim() && panNumber.trim().length === 10;
    const firmOk = !!firmName?.trim() && firmName.trim().length >= 2;

    return form.formState.isValid && panOk && firmOk;
  }, [
    displayName,
    email,
    phoneNumber,
    gstDetails,
    idType,
    isAdmin,
    isVerified,
    loadingGst,
    panNumber,
    firmName,
    selectedBusinessType,
    otherBusinessType,
    form.formState.isSubmitting,
    form.formState.isValid,
  ]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin) {
      const data: FormValues = {
        displayName: form.getValues("displayName"),
        email: form.getValues("email"),
        phone: form.getValues("phone"),
        photoUrl: form.getValues("photoUrl"),

        businessType: "",
        businessIdType: "gst",
        gstNumber: "",
        panNumber: "",
        firmName: "",
        otp: "",
        otherBusinessType: "",
      } as FormValues;

      handleSubmit(data);
      return;
    }

    form.handleSubmit(handleSubmit)(e);
  };

  const lockPhoneInput =
    !!clientUser?.phone || otpSent || isVerified || lockMobileInput; // keep existing behavior + lock after OTP sent

  return (
    <>
      <ProfileCompleteAsk open={dialogOpen} setOpen={setDialogOpen} />

      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="flex flex-col items-center justify-center gap-4 text-xl md:text-2xl">
            <div className="flex items-center gap-2">
              <CircleUserRound className="size-8" /> Complete Your Profile
            </div>
            <span className="flex items-center justify-center gap-2 text-xs font-medium text-yellow-700">
              Please ensure your profile information is accurate and complete.
              This will help us provide you with the best experience and
              services.
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="py-2">
          <div className="relative">
            {pageLoading && (
              <div className="absolute top-0 z-30 flex h-full w-full items-center justify-center gap-2 bg-zinc-400/10">
                <div className="flex h-1/8 w-3/4 items-center justify-center gap-2 rounded-lg border-1 bg-white">
                  <Loader2 className="animate-spin" />
                  Fetching your profile...
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={onSubmit}>
                <fieldset
                  className="flex flex-col gap-5"
                  disabled={form.formState.isSubmitting}
                >
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-start gap-1">
                          Your Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Name"
                            readOnly={!!clientUser?.displayName}
                            className={clsx(
                              clientUser?.displayName && "font-semibold",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex w-full flex-col">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col gap-1">
                          <div className="grid grid-cols-1 items-end justify-center gap-2 md:grid-cols-[minmax(0,1fr)_max-content] md:gap-4">
                            <div
                              className={clsx("flex min-w-0 flex-col gap-1", {
                                ["md:col-span-2"]: clientUser?.email,
                              })}
                            >
                              <FormLabel className="flex items-start gap-1">
                                Your email
                              </FormLabel>
                              <FormControl className="">
                                <Input
                                  {...field}
                                  placeholder="Your email"
                                  readOnly={!!clientUser?.email}
                                  className={clsx(
                                    clientUser?.email && "w-full font-semibold",
                                  )}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                              {clientUser?.email && (
                                <div className="inline-flex w-fit gap-1 text-xs font-semibold text-green-700">
                                  <CheckCircle2 className="size-4 text-green-700" />
                                  Verified {isPhoneLinked && "and linked."}
                                </div>
                              )}
                            </div>

                            {!clientUser?.email && (
                              <div className="flex flex-col items-center justify-between gap-2 md:flex-row md:gap-4">
                                <span className="text-muted-foreground flex justify-center text-sm">
                                  -- or --
                                </span>
                                <Button
                                  type="button"
                                  className="w-auto cursor-pointer rounded-full shadow-md"
                                  variant="outline"
                                  onClick={linkGoogle}
                                >
                                  {linkingGoogle ? (
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
                              </div>
                            )}
                          </div>

                          {!clientUser?.email && (
                            <span className="flex items-center gap-1 text-xs text-sky-900">
                              <Info className="size-4" />
                              The Google Account linked will allow you to log in
                              using Google in the future.
                            </span>
                          )}
                        </FormItem>
                      )}
                    />
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
                            </FormLabel>
                            <FormControl>
                              <div className="flex w-full flex-row gap-2 md:items-center md:gap-4">
                                <Input
                                  {...field}
                                  placeholder="Mobile Number"
                                  inputMode="numeric"
                                  maxLength={10}
                                  onChange={(e) => {
                                    if (!isNaN(Number(e.target.value)))
                                      field.onChange(e);
                                  }}
                                  readOnly={
                                    !!clientUser?.phone ||
                                    lockPhoneInput ||
                                    isVerified
                                  }
                                  className={clsx(
                                    !!clientUser?.phone ||
                                      lockPhoneInput ||
                                      isVerified
                                      ? "font-semibold"
                                      : "",
                                  )}
                                />

                                {!otpSent && !isVerified && (
                                  <Button
                                    disabled={!isPhoneValid}
                                    type="button"
                                    onClick={() => sendOtp(phoneNumber)}
                                  >
                                    {sendingOtp ? (
                                      <>
                                        <Loader2 className="size-4 animate-spin" />{" "}
                                        Sending OTP
                                      </>
                                    ) : (
                                      <>
                                        <Send className="size-4" /> Send OTP
                                      </>
                                    )}
                                  </Button>
                                )}

                                {otpSent && !isVerified && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="link"
                                      onClick={() => {
                                        // reset hook state
                                        editMobile();
                                        // reset form otp field + allow editing phone again
                                        form.resetField("otp");
                                        setIsVerified(false);
                                        setIsPhoneLinked(false);
                                      }}
                                    >
                                      <PencilIcon className="size-4" />{" "}
                                      <span className="hidden md:inline-flex">
                                        Edit Mobile Number
                                      </span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={sendingOtp || resendIn > 0}
                                      onClick={resendOtp}
                                      className="hidden md:inline-flex"
                                    >
                                      <Repeat className="size-4" />{" "}
                                      {resendIn > 0
                                        ? `Resend in ${resendIn}s`
                                        : "Resend"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {!isVerified && (
                      <span className="flex items-start gap-1 text-xs text-sky-900">
                        <Info className="size-4" />
                        The mobile number will be linked to your account for OTP
                        login in the future
                      </span>
                    )}

                    {isVerified && (
                      <div className="inline-flex w-fit gap-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="size-4 text-green-700" />
                        Verified {isPhoneLinked && "and linked."}
                      </div>
                    )}
                  </div>

                  {otpSent && !isVerified && (
                    <div className="grid grid-cols-1 items-end justify-center gap-4 md:grid-cols-[1fr_auto]">
                      <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-between gap-2 md:flex-row md:items-center md:gap-4">
                            <FormLabel className="min-w-max text-sm font-normal whitespace-nowrap">
                              Enter OTP
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
                      <div className="flex items-center justify-between gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={sendingOtp || resendIn > 0}
                          onClick={resendOtp}
                          className="inline-flex min-w-max text-xs md:hidden"
                          size={"sm"}
                        >
                          <Repeat className="size-4" />{" "}
                          {resendIn > 0
                            ? `Resend OTP in ${resendIn}s`
                            : "Resend OTP"}
                        </Button>
                        <Button
                          disabled={isVerifying}
                          type="button"
                          className="flex-1"
                          onClick={async () => {
                            const code = (otp ?? "").trim();
                            if (!code) return;
                            await verifyOtp(code);
                          }}
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Verifying OTP
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="size-4" />
                              Verify OTP
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {isAdmin ? (
                    <div className="rounded-md bg-green-100 p-4 text-center">
                      <p className="text-sm font-semibold text-green-800">
                        ✅ You are an admin. Only basic profile information is
                        required.
                      </p>
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-start gap-1">
                              Business type
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={(field.value ?? "") as string}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select your business type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="retailer">
                                    Retailer
                                  </SelectItem>
                                  <SelectItem value="wholesaler">
                                    Wholesaler
                                  </SelectItem>
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

                      {selectedBusinessType === "other" && (
                        <FormField
                          control={form.control}
                          name="otherBusinessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Specify your role or business type"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Keep RHF in-sync with local idType */}
                      <FormField
                        control={form.control}
                        name="businessIdType"
                        render={({ field }) => (
                          <input type="hidden" {...field} value={idType} />
                        )}
                      />

                      <div className="space-y-1">
                        <FormLabel>Business Identification Through</FormLabel>

                        <Select
                          value={idType}
                          onValueChange={(value: "pan" | "gst") => {
                            setIdType(value);
                            setGstDetails(null);
                            setGstError(null);

                            form.setValue("businessIdType", value, {
                              shouldValidate: true,
                            });
                            form.setValue("gstNumber", "", {
                              shouldValidate: true,
                            });
                            form.setValue("panNumber", "", {
                              shouldValidate: true,
                            });
                            form.setValue("firmName", "", {
                              shouldValidate: true,
                            });

                            form.trigger([
                              "businessIdType",
                              "gstNumber",
                              "panNumber",
                              "firmName",
                            ]);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gst">GST Number</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                          </SelectContent>
                        </Select>

                        <p className="text-muted-foreground text-xs">
                          {idType === "gst"
                            ? "Select this if you have a GST registration"
                            : "Select this if you don't have GST but have a PAN card and firm name to provide."}
                        </p>
                      </div>

                      {idType === "gst" ? (
                        <FormField
                          control={form.control}
                          name="gstNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GSTIN Number</FormLabel>
                              <FormControl>
                                <div className="flex flex-col gap-2 md:flex-row">
                                  <Input
                                    {...field}
                                    placeholder="Enter 15-digit GSTIN"
                                    maxLength={15}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    className={clsx(
                                      gstDetails &&
                                        "border-green-300 ring-1 ring-green-200",
                                      !gstDetails &&
                                        field.value?.length === 15 &&
                                        "border-orange-300",
                                    )}
                                  />
                                  {!loadingGst && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        fetchGstDetails(field.value || "")
                                      }
                                      disabled={
                                        field.value?.length !== 15 ||
                                        loadingGst ||
                                        form.formState.isSubmitting
                                      }
                                      className="gap-2"
                                    >
                                      <span>Get Details</span>
                                      <CloudDownload className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </FormControl>

                              {loadingGst && (
                                <div className="mt-3">
                                  <GstDetails
                                    data={null}
                                    loading={loadingGst}
                                  />
                                </div>
                              )}
                              {gstDetails && (
                                <div className="mt-3">
                                  <GstDetails
                                    data={gstDetails}
                                    loading={loadingGst}
                                  />
                                </div>
                              )}
                              {gstError && (
                                <div className="text-destructive">
                                  {gstError}
                                </div>
                              )}

                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="flex w-full flex-col gap-4">
                          <FormField
                            control={form.control}
                            name="panNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PAN Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter 10-character PAN"
                                    maxLength={10}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="firmName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Firm/Business Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter your firm or business name"
                                    maxLength={100}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button
                    disabled={!canSubmit}
                    type="submit"
                    className="w-full cursor-pointer tracking-wide uppercase"
                  >
                    {form.formState.isSubmitting ? (
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
          </div>
        </CardContent>
      </Card>
    </>
  );
}
