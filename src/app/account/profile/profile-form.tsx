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
import { userProfileSchema } from "@/validation/profileSchema";
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
  CircleUserRound,
  CloudDownload,
  Info,
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
import GoogleIcon from "@/components/custom/google-icon.svg";
import Image from "next/image";
import { GstDetails } from "@/components/custom/gst-details";
import { GstDetailsData } from "@/data/businessProfile";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatBusinessProfile } from "@/lib/business-profile-formatter";
import { useLinkAuthProviders } from "@/hooks/useLinkAuthProviders";
import { setToken } from "@/context/actions";
import { updateUserFirebaseMethods } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileCompleteAsk from "./profile-complete-ask";

export default function ProfileForm() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const clientUser = auth?.clientUser;

  const recaptchaVerifier = useRecaptcha({ enabled: true });

  const [isVerified, setIsVerified] = useState(false);
  const [isPhoneLinked, setIsPhoneLinked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [gstDetails, setGstDetails] = useState<GstDetailsData | null>(null);
  const [loadingGst, setLoadingGst] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);
  const [idType, setIdType] = useState<"pan" | "gst">("gst");

  const [didInit, setDidInit] = useState(false);

  const isAdmin = clientUser?.userType === "admin";

  const { linkGoogle, linkingGoogle } = useLinkAuthProviders({
    user: auth.currentUser,
    recaptchaVerifier: recaptchaVerifier.verifier,
    onToken: async (idToken, refreshToken) => {
      await setToken(idToken, refreshToken);
    },
    onLinked: async () => {
      await updateUserFirebaseMethods();
      await auth.refreshClientUser();
    },
    toast,
  });

  // ✅ RHF: don’t rely on async defaultValues; reset when clientUser loads/changes. [web:125]
  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      businessType: undefined,
      businessIdType: undefined,
      gstNumber: "",
      panNumber: "",
      firmName: "",
      photoUrl: "",
      otp: "",
      otherBusinessType: "",
    },
  });

  useEffect(() => {
    if (!clientUser || didInit) return;
    const from = searchParams.get("from");
    if (from === "login") {
      setDialogOpen(true);

      const next = new URLSearchParams(searchParams.toString());
      next.delete("from");

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname); // removes param without full reload [web:177]
    }
    const nextDefaults = {
      displayName: clientUser.displayName || "",
      email: clientUser.email || "",
      phone: clientUser.phone || "",
      businessType: clientUser.businessType || undefined,
      businessIdType: (clientUser.businessProfile
        ? clientUser.businessProfile.gstin
          ? "gst"
          : "pan"
        : undefined) as "gst" | "pan" | undefined,
      gstNumber: clientUser.businessProfile?.gstin || "",
      firmName: clientUser.firmName || "",
      panNumber: clientUser.panNumber || "",
      photoUrl: clientUser.photoUrl || "",
      otp: undefined,
      otherBusinessType: undefined,
    };

    form.reset(nextDefaults);
    setIdType((nextDefaults.businessIdType ?? "gst") as "gst" | "pan");
    setIsVerified(!!clientUser.phone);
    setIsPhoneLinked(!!clientUser.phone && !!clientUser.email);
    setDidInit(true);
  }, [clientUser?.uid, didInit, form]);

  const selectedBusinessType = form.watch("businessType");
  const phoneNumber = form.watch("phone");
  const otp = form.watch("otp");

  const panNumber = form.watch("panNumber");
  const firmName = form.watch("firmName");

  const [isPhoneValid, setIsPhoneValid] = useState(false);

  useEffect(() => {
    if (loginUserMobileSchema.safeParse({ mobile: phoneNumber }).success) {
      setIsPhoneValid(true);
    } else {
      setIsPhoneValid(false);
    }
  }, [phoneNumber]);

  const { otpReset, otpSent, sendingOtp, isVerifying, sendOtp, verifyOtp } =
    useMobileOtp({
      onSuccess: async () => {
        setIsVerified(true);
        setIsPhoneLinked(true);
        await updateUserProfile(
          {
            phone: phoneNumber,
          },
          { profileComplete: false },
        );
        await auth.refreshClientUser();
      },
      appVerifier: recaptchaVerifier.verifier,
      ensureRecaptcha: recaptchaVerifier.ensureReady,
      resetRecaptcha: recaptchaVerifier.reset,
      linkPhone: true,
    });

  useEffect(() => {
    if (otpReset) {
      form.resetField("otp");
    }
  }, [otpReset, form]);

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

      if (isAdmin) {
        await updateUserProfile(
          {
            displayName: data.displayName,
            email: data.email,
            phone: data.phone,
            photoUrl: data.photoUrl,
            userType: "admin",
            businessType: "",
            businessProfile: null,
          },
          { profileComplete: true },
        );
      } else {
        const { otherBusinessType, ...rest } = data;
        const finalBusinessType =
          data.businessType === "other" && otherBusinessType
            ? otherBusinessType
            : data.businessType;

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

        await updateUserProfile(
          {
            ...rest,
            userType: "customer",
            businessType: finalBusinessType,
            businessProfile,
          },
          { profileComplete: true },
        );
      }

      const token = (await auth.currentUser?.getIdToken(true)) || "";
      const refreshToken = auth.currentUser?.refreshToken || "";
      await setToken(token, refreshToken);
      const freshClientUser = await auth.refreshClientUser();

      const waSendResp = await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "account_approval_request_to_admin",
          customerUserId: freshClientUser?.uid,
          customerName: freshClientUser?.displayName || "User",
          customerPhone: freshClientUser?.phone || "Not provided",
          customerEmail: freshClientUser?.email || "Not provided",
          customerBusinessProfile: formatBusinessProfile(freshClientUser),
        }),
      });

      if (waSendResp.ok) {
        toast.success("Approval Request Sent", {
          description:
            "Your profile has been updated and an approval request has been sent to the admin.",
        });
      }

      const redirect = searchParams.get("redirect") ?? "/";
      router.push(redirect);

      toast.success("Success!", {
        description: "Your profile has been saved successfully!",
      });
    } catch (err: unknown) {
      console.error("Profile Submit error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    }
  };

  const { isSubmitting } = form.formState;
  useEffect(() => {
    const values = form.getValues();
    const result = userProfileSchema.safeParse(values);
    console.log(
      "zod safeParse success?",
      result.success,
      result.success ? null : JSON.stringify(result.error.issues, null, 2),
    );
  }, [form.watch()]);

  // useEffect(() => {
  //   console.log("submit blockers", {
  //     isVerified,
  //     isSubmitting,
  //     loadingGst,
  //     isValid: form.formState.isValid,
  //     errors: Object.keys(form.formState.errors),
  //     idType,

  //     gstDetailsPresent: gstDetails !== null,
  //     panNumber,
  //   });
  // }, [
  //   isVerified,
  //   isSubmitting,
  //   loadingGst,
  //   form.formState.isValid,
  //   form.formState.errors,
  //   idType,

  //   gstDetails,
  //   panNumber,
  // ]);

  const canSubmit = () => {
    if (isAdmin) {
      return (
        isVerified &&
        !isSubmitting &&
        !!form.watch("displayName") &&
        !!form.watch("email") &&
        !!form.watch("phone")
      );
    }
    // console.log({
    //   isVerified,
    //   isSubmitting,
    //   gstDetails,
    //   panNumber,
    //   isValid: form.formState.isValid,
    //   formErrors: Object.keys(form.formState.errors),
    // });

    return (
      isVerified &&
      !isSubmitting &&
      !loadingGst &&
      form.formState.isValid &&
      (idType === "gst"
        ? gstDetails !== null
        : panNumber &&
          panNumber.length === 10 &&
          firmName &&
          firmName.length >= 2)
    );
  };

  // useEffect(() => {
  //   if (Object.keys(form.formState.errors).length) {
  //     console.log("RHF errors:", form.formState.errors);
  //   }
  // }, [form.formState.errors]);

  // console.log(canSubmit());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin) {
      const data = {
        displayName: form.getValues("displayName"),
        email: form.getValues("email"),
        phone: form.getValues("phone"),
        photoUrl: form.getValues("photoUrl"),
        businessType: "",
        businessIdType: "gst" as const,
        gstNumber: "",
        panNumber: "",
        firmName: "",
        userType: "admin" as const,
      };
      handleSubmit(data);
    } else {
      form.handleSubmit(handleSubmit)(e);
    }
  };

  return (
    <>
      <ProfileCompleteAsk open={dialogOpen} setOpen={setDialogOpen} />
      <Card className="gap-0">
        <CardHeader className="">
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
            {auth.loading && (
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
                  {/* Display name */}
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

                  {/* Email + link google */}
                  <div className="flex flex-col">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <div className="flex w-full flex-col items-center justify-center gap-1 md:flex-row md:items-end md:gap-4">
                            <div className="flex w-full flex-col gap-1">
                              <FormLabel className="flex items-start gap-1">
                                Your email
                              </FormLabel>
                              <FormControl className="w-full">
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
                            </div>

                            {!clientUser?.email && (
                              <div className="flex flex-col md:flex-row">
                                <span className="text-muted-foreground flex justify-center text-sm md:mb-2">
                                  or
                                </span>
                                <Button
                                  type="button"
                                  className="w-full cursor-pointer rounded-full shadow-md md:w-auto"
                                  variant={"outline"}
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

                  {/* Phone + OTP */}
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
                              <div className="flex w-full gap-2">
                                <Input
                                  {...field}
                                  placeholder="Mobile Number"
                                  readOnly={!!clientUser?.phone || otpSent}
                                  className={clsx(
                                    !!clientUser?.phone && "font-semibold",
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

                    {/* ✅ Ask only Google-login users if they want linking */}
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
                        {isVerified && "Verified"}{" "}
                        {isPhoneLinked && "and Linked to your email account."}
                      </div>
                    )}
                  </div>

                  {/* OTP entry */}
                  {otpSent && !isVerified && (
                    <div className="grid grid-cols-1 items-end justify-center gap-4 md:grid-cols-[8fr_1fr] md:gap-4">
                      <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-start gap-1">
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

                      <Button
                        disabled={isVerifying}
                        type="button"
                        className="w-full"
                        onClick={async () => {
                          const code = otp ?? "";
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
                          "Verify OTP"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Admin banner */}
                  {isAdmin ? (
                    <div className="rounded-md bg-green-100 p-4 text-center">
                      <p className="text-sm font-semibold text-green-800">
                        ✅ You are an admin. Only basic profile information is
                        required.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Business type */}
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
                                onValueChange={field.onChange}
                                value={field.value}
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

                      {/* Hidden businessIdType synced with idType */}
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

                      {/* GST/PAN */}
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
                                        isSubmitting
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
                                  <GstDetails data={null} loading={true} />
                                </div>
                              )}
                              {gstDetails && (
                                <div className="mt-3">
                                  <GstDetails
                                    data={gstDetails}
                                    loading={false}
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

                  {/* Submit */}
                  <Button
                    disabled={!canSubmit()}
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
          </div>
        </CardContent>
      </Card>
    </>
  );
}
