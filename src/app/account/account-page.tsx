"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, ChangeEvent, ReactNode } from "react";
import UpdatePasswordForm from "./update-password";
import Image from "next/image";
import { useAuth } from "@/context/useAuth";
import clsx from "clsx";
import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/firebase/client";
import { toast } from "sonner";
import { updateUser } from "./actions";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import {
  CopyIcon,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldOff,
  UserX,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  User,
  Building2,
  FileText,
  Shield,
  BadgeCheck,
  BadgeX,
  KeyRound,
  Hash,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type { AccountStatus, FirebaseAuthData } from "@/types/user"; // adjust path if needed
import { BusinessProfile } from "@/data/businessProfile";

type AccountStatusUI = Exclude<AccountStatus, never>;

export default function AccountPage({
  isPasswordProvider,
}: {
  isPasswordProvider: boolean;
}) {
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => setHasHydrated(true), []);

  const { clientUser, clientUserLoading, setClientUser } = useAuth();

  const isAdmin = clientUser?.userType === "admin";
  const accountStatus: AccountStatusUI = (clientUser?.accountStatus ??
    "pending") as AccountStatusUI;

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);

  const [photo, setPhoto] = useState<string>("");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (clientUser?.photoUrl) setPhoto(clientUser.photoUrl);
  }, [clientUser]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (e) {
      console.error("Copy failed", e);
      toast.error("Failed to copy");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const titleCase = (value?: string | null) => {
    const s = (value ?? "").toString().trim();
    if (!s) return "-";
    return s
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.trim() === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
    if (typeof value === "object") return "—";
    return String(value);
  };

  const StatusBadge = ({ status }: { status: AccountStatusUI }) => {
    const base = "capitalize";
    switch (status) {
      case "approved":
        return (
          <Badge
            className={clsx(
              base,
              "bg-green-100 text-green-800 hover:bg-green-100",
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            className={clsx(base, "bg-red-100 text-red-800 hover:bg-red-100")}
          >
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            className={clsx(
              base,
              "bg-orange-100 text-orange-800 hover:bg-orange-100",
            )}
          >
            <ShieldOff className="h-3 w-3" />
            Suspended
          </Badge>
        );
      case "deactivated":
        return (
          <Badge
            className={clsx(
              base,
              "bg-zinc-100 text-zinc-800 hover:bg-zinc-100",
            )}
          >
            <UserX className="h-3 w-3" />
            Deactivated
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge
            className={clsx(
              base,
              "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
            )}
          >
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getAccountStatusInfo = (status: AccountStatusUI) => {
    const reason = clientUser?.rejectionReason?.trim(); // reusing your existing field for “reason/note” messaging

    switch (status) {
      case "approved":
        return {
          icon: CheckCircle2,
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Account approved!",
          description: "You have access to all features.",
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Account rejected.",
          description: reason
            ? `Rejection reason: ${reason}`
            : "Please contact support for assistance.",
        };
      case "suspended":
        return {
          icon: ShieldOff,
          color: "text-orange-700",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "Account suspended.",
          description: reason
            ? `Suspension reason: ${reason}`
            : "Your access is temporarily restricted.",
        };
      case "deactivated":
        return {
          icon: UserX,
          color: "text-zinc-700",
          bgColor: "bg-zinc-50",
          borderColor: "border-zinc-200",
          title: "Account deactivated.",
          description: reason
            ? `Deactivation note: ${reason}`
            : "Your account is currently inactive.",
        };
      case "pending":
      default:
        return {
          icon: Clock,
          color: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "Pending approval.",
          description:
            "Your account is under review. You'll be notified once approved.",
        };
    }
  };

  const statusInfo = getAccountStatusInfo(accountStatus);
  const StatusIcon = statusInfo.icon;

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!clientUser?.uid) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setPhoto(e.target.result as string);
    };
    reader.readAsDataURL(file);

    const imagePath = `users/${clientUser.uid}/profile-picture/${Date.now()}-${file.name}`;
    const logoStorageRef = ref(storage, imagePath);

    setUploading(true);
    setUploadPercent(0);

    try {
      const task = uploadBytesResumable(logoStorageRef, file);

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setUploadPercent(percent);
          },
          (error) => reject(error),
          () => resolve(),
        );
      });

      await updateUser({ userId: clientUser.uid, photoUrl: imagePath });

      const formatted = imageUrlFormatter(imagePath);
      setPhoto(formatted);
      setClientUser((prev) => (prev ? { ...prev, photoUrl: formatted } : prev));

      toast.success("Profile updated!", {
        description: "New profile picture is set for your account.",
      });
    } catch (error) {
      console.error("Upload/update failed", error);
      toast.error("Failed to update profile picture", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const DetailRow = ({
    label,
    value,
    valueNode,
    icon: Icon,
    copyValue,
    copyLabel,
  }: {
    label: string;
    value?: unknown;
    valueNode?: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    copyValue?: string;
    copyLabel?: string;
  }) => {
    const display = valueNode ?? (
      <span className="break-all">{formatValue(value)}</span>
    );

    return (
      <li className="flex items-start justify-between gap-4 rounded-md border bg-white p-3">
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {label}
        </span>
        <span className="text-primary flex items-center gap-2 text-right text-sm font-semibold">
          {display}
          {copyValue ? (
            <CopyIcon
              className="text-primary size-4 shrink-0 cursor-pointer"
              onClick={() => copyToClipboard(copyValue, copyLabel || label)}
            />
          ) : null}
        </span>
      </li>
    );
  };

  const BusinessProfileCard = ({ bp }: { bp: BusinessProfile }) => {
    return (
      <div className="space-y-3 rounded-md border bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Building2 className="h-4 w-4" />
            Business profile
          </div>
          <Badge variant="outline" className="text-xs">
            Verified: {formatDate(bp.verifiedAt)}
          </Badge>
        </div>

        <ul className="grid grid-cols-1 gap-3">
          <DetailRow
            label="GSTIN"
            value={bp.gstin}
            icon={Hash}
            copyValue={bp.gstin}
            copyLabel="GSTIN"
          />
          <DetailRow label="Status" value={bp.status} icon={BadgeCheck} />
          <DetailRow label="Legal name" value={bp.legalName} icon={User} />
          <DetailRow label="Trade name" value={bp.tradeName} icon={Building2} />
          <DetailRow label="Address" value={bp.address} icon={Building2} />
          <DetailRow
            label="Registration date"
            value={formatDate(bp.registrationDate)}
            icon={Clock}
          />
          <DetailRow
            label="Nature of business"
            value={bp.natureOfBusiness}
            icon={FileText}
          />
        </ul>
      </div>
    );
  };

  // Note: your Firestore shows identities values as arrays (e.g. phone: ["+91..."])
  // so handle both string | string[] safely without changing your global type.
  const FirebaseAuthCard = ({ fa }: { fa: FirebaseAuthData }) => {
    const identities = (fa.identities ?? {}) as Record<string, unknown>;
    const identityEntries = Object.entries(identities); // providerKey -> unknown (usually string[])

    const providerMeta = (providerId?: string) => {
      const id = (providerId ?? "").toLowerCase();
      const meta: Record<
        string,
        {
          label: string;
          Icon: React.ComponentType<{ className?: string }>;
          hint: string;
          tone: string;
        }
      > = {
        phone: {
          label: "Phone number",
          Icon: Phone,
          hint: "You sign in using an OTP (SMS verification).",
          tone: "text-indigo-700",
        },
        password: {
          label: "Email & password",
          Icon: Mail,
          hint: "You sign in using your email and a password.",
          tone: "text-sky-700",
        },
        email: {
          label: "Email",
          Icon: Mail,
          hint: "You sign in using your email.",
          tone: "text-sky-700",
        },
      };

      return (
        meta[id] ?? {
          label: providerId || "Unknown provider",
          Icon: User,
          hint: "Your sign-in method couldn’t be determined.",
          tone: "text-zinc-700",
        }
      );
    };

    const maskPhone = (phone: string) => {
      const s = (phone ?? "").trim();
      if (!s) return "-";
      const last4 = s.slice(-4);
      const ccMatch = s.match(/^\+\d{1,3}/)?.[0] ?? "";
      return ccMatch ? `${ccMatch}•••••${last4}` : `•••••${last4}`;
    };

    const maskEmail = (email: string) => {
      const s = (email ?? "").trim();
      if (!s || !s.includes("@")) return s || "-";
      const [local, domain] = s.split("@");
      const first = local.slice(0, 1);
      return `${first}••••@${domain}`;
    };

    const asStringArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String).filter(Boolean);
      if (typeof v === "string" && v.trim()) return [v.trim()];
      return [];
    };

    const formatIdentifier = (providerKey: string, value: string) => {
      const key = providerKey.toLowerCase();
      if (key === "phone") return maskPhone(value);
      if (key === "password" || key === "email") return maskEmail(value);
      return value;
    };

    const primary = providerMeta(fa.sign_in_provider);
    const primaryIdentifiers = asStringArray(identities[fa.sign_in_provider]);
    const primaryPretty = primaryIdentifiers.map((v) =>
      formatIdentifier(fa.sign_in_provider, v),
    );

    const linkedProviders = identityEntries
      .map(([k]) => providerMeta(k).label)
      .filter(Boolean);
    const linkedProvidersText = linkedProviders.length
      ? Array.from(new Set(linkedProviders)).join(", ")
      : "None";

    return (
      <div className="space-y-3 rounded-md border bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Shield className="h-4 w-4" />
          Sign-in details
        </div>

        <div className="rounded-md bg-zinc-50 p-3">
          <div className="flex items-start gap-2">
            <primary.Icon className={clsx("mt-0.5 h-4 w-4", primary.tone)} />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-zinc-900">
                You created your account using {primary.label}.
              </div>
              <div className="text-muted-foreground text-sm">{primary.hint}</div>

              {primaryPretty.length > 0 && (
                <div className="text-muted-foreground text-sm">
                  Primary identifier:{" "}
                  <span className="font-medium text-zinc-900">
                    {primaryPretty.join(", ")}
                  </span>
                </div>
              )}

              <div className="text-muted-foreground text-sm">
                Linked sign-in methods:{" "}
                <span className="font-medium text-zinc-900">
                  {linkedProvidersText}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-3">
          <DetailRow
            label="Primary sign-in method"
            value={primary.label}
            icon={KeyRound}
          />
        </ul>

        <div className="space-y-2">
          <div className="text-muted-foreground text-sm">Linked identifiers</div>

          {identityEntries.length ? (
            <div className="rounded-md border bg-white">
              <ul className="divide-y">
                {identityEntries.map(([providerKey, raw]) => {
                  const meta = providerMeta(providerKey);
                  const values = asStringArray(raw);
                  const displayValues = values.length
                    ? values.map((v) => formatIdentifier(providerKey, v))
                    : ["-"];

                  return (
                    <li
                      key={providerKey}
                      className="flex items-start justify-between gap-4 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <meta.Icon className={clsx("mt-0.5 h-4 w-4", meta.tone)} />
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {meta.label}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Provider key:{" "}
                            <span className="font-mono">{providerKey}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {displayValues.map((v) => (
                          <div
                            key={`${providerKey}-${v}`}
                            className="text-xs font-semibold text-zinc-900 break-all"
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No linked identifiers found.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!hasHydrated || clientUserLoading || !clientUser) return null;

  const profileComplete = !!clientUser.profileComplete;

  return (
    <div>
      <Card className="mx-auto w-full max-w-screen-md">
        <CardHeader>
          <CardTitle className="text-primary text-center text-2xl font-semibold">
            My Account
          </CardTitle>

          {!isAdmin && (
            <div className="space-y-2">
              <Alert
                className={clsx(
                  statusInfo.bgColor,
                  statusInfo.borderColor,
                  "items-center",
                )}
              >
                <StatusIcon className={clsx("h-4 w-4", statusInfo.color)} />
                <AlertDescription className={clsx("ml-2 text-sm", statusInfo.color)}>
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="font-semibold">{statusInfo.title}</span>{" "}
                      {statusInfo.description}
                    </div>
                    <div className="mt-1 md:mt-0">
                      <StatusBadge status={accountStatus} />
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Editable profile photo */}
          <div className="relative flex flex-col items-center justify-center gap-2 py-4">
            <Avatar className="h-24 w-24 bg-white p-1 ring-2 ring-primary md:h-28 md:w-28">
              {photo ? (
                <Image
                  src={photo}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                  width={112}
                  height={112}
                  priority
                />
              ) : (
                <AvatarFallback className="text-xl">
                  {(clientUser.displayName || clientUser.email)?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>

            {uploading ? (
              <div className="my-2 flex w-full flex-col items-center">
                <Progress value={uploadPercent} className="w-48" />
                <span className="text-primary mt-2 text-center text-sm font-medium">
                  Uploading and updating your profile picture — {uploadPercent}%
                </span>
              </div>
            ) : (
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
                <span className="bg-muted text-primary hover:text-primary/90 cursor-pointer rounded-md px-3 py-1 text-xs">
                  Change profile picture
                </span>
              </label>
            )}
          </div>

          {/* UID */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-muted-foreground text-center text-xs">
              Your Unique Identification Number (UID) in our system:
            </span>
            <span className="text-primary flex items-center justify-center gap-2 text-sm font-semibold">
              {clientUser.uid}
              <CopyIcon
                className="text-primary size-4 cursor-pointer"
                onClick={() => copyToClipboard(clientUser.uid, "UID")}
              />
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Role banner */}
          {isAdmin ? (
            <div className="rounded-md bg-green-100 p-2 px-4 text-center text-sm text-green-700">
              You are an <span className="font-semibold">Admin</span> — manage everything!
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-md p-2 text-sm">
              You have user access under role:
              <span className="text-primary text-lg font-semibold first-letter:uppercase">
                {clientUser.userType}
              </span>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow
                label="Display name"
                value={clientUser.displayName}
                icon={User}
              />

              <DetailRow
                label="Email"
                value={clientUser.email}
                icon={Mail}
                copyValue={clientUser.email ?? undefined}
                copyLabel="Email"
              />

              <DetailRow
                label="Phone"
                value={clientUser.phone}
                icon={Phone}
                copyValue={clientUser.phone ?? undefined}
                copyLabel="Phone"
              />

              <DetailRow
                label="Business type"
                valueNode={<span className="break-all">{titleCase(clientUser.businessType)}</span>}
                icon={Building2}
              />

              <DetailRow
                label="GST number"
                value={clientUser.gstNumber}
                icon={FileText}
                copyValue={clientUser.gstNumber}
                copyLabel="GST number"
              />

              <DetailRow
                label="PAN number"
                value={clientUser.panNumber}
                icon={FileText}
                copyValue={clientUser.panNumber}
                copyLabel="PAN number"
              />

              <DetailRow
                label="Profile status"
                icon={profileComplete ? BadgeCheck : BadgeX}
                valueNode={
                  <Badge
                    className={clsx(
                      "capitalize",
                      profileComplete
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                    )}
                  >
                    {profileComplete ? "Complete" : "Incomplete"}
                  </Badge>
                }
              />

              {!isAdmin && (
                <DetailRow
                  label="Account status"
                  icon={Clock}
                  valueNode={<StatusBadge status={accountStatus} />}
                />
              )}
            </ul>
          </div>

          {/* Firebase auth card moved OUT of collapsible */}
          {clientUser.firebaseAuth ? (
            <FirebaseAuthCard fa={clientUser.firebaseAuth} />
          ) : null}

          {/* Show collapsible ONLY when GST number AND GST details are present */}
          {clientUser.gstNumber && clientUser.businessProfile ? (
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left transition-colors hover:bg-zinc-50",
                    moreOpen && "bg-zinc-50",
                  )}
                >
                  <span className="text-sm font-medium text-zinc-700">
                    {moreOpen ? "Hide GST details" : "Show GST details"}
                  </span>
                  {moreOpen ? (
                    <ChevronUp className="h-4 w-4 text-zinc-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-600" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-3 space-y-3">
                <BusinessProfileCard bp={clientUser.businessProfile} />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </CardContent>

        {isPasswordProvider && (
          <>
            <Separator />
            <CardContent>
              <div className="mb-5 text-md font-semibold text-cyan-950">
                Update your password
              </div>
              <UpdatePasswordForm />
            </CardContent>
          </>
        )}

        {!isAdmin && (
          <>
            <Separator />
            <CardFooter className="flex flex-col gap-1">
              <div className="flex w-full text-xl font-bold text-red-600">
                Delete account
              </div>
              <span className="flex w-full text-sm text-zinc-700 italic">
                You will be deleting your account permanently. Are you sure?
              </span>
              
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
