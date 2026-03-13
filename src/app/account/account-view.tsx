"use client";

import React, { memo, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
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
  BadgeCheck,
  BadgeX,
  Hash,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import DefaultUserIcon from "@/assets/icons/user.png";

import type { BusinessProfile, UserData } from "@/types/user";

import FirebaseAuthMethods from "./firebase-auth-methods";
import { AccountStatus } from "@/types/userGate";

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCase(value?: string | null) {
  const s = (value ?? "").toString().trim();
  if (!s) return "-";
  return s
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && value.trim() === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "object") return "—";
  return String(value);
}

function getAccountStatusInfo(
  status: AccountStatus | null,
  reason?: string | null,
) {
  const r = reason?.trim();

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
        description: r
          ? `Rejection reason: ${r}`
          : "Please contact support for assistance.",
      };
    case "suspended":
      return {
        icon: ShieldOff,
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        title: "Account suspended.",
        description: r
          ? `Suspension reason: ${r}`
          : "Your access is temporarily restricted.",
      };
    case "deactivated":
      return {
        icon: UserX,
        color: "text-zinc-700",
        bgColor: "bg-zinc-50",
        borderColor: "border-zinc-200",
        title: "Account deactivated.",
        description: r
          ? `Deactivation note: ${r}`
          : "Your account is currently inactive.",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        title: "Pending approval.",
        description:
          "Your account is under review. You'll be notified once approved.",
      };
    default:
      return null;
  }
}

function DetailRow({
  label,
  value,
  valueNode,
  icon: Icon,
  copyValue,
  onCopy,
}: {
  label: string;
  value?: unknown;
  valueNode?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  copyValue?: string;
  onCopy?: (text: string, label: string) => void;
}) {
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
        {copyValue && onCopy ? (
          <CopyIcon
            className="text-primary size-4 shrink-0 cursor-pointer"
            onClick={() => onCopy(copyValue, label)}
          />
        ) : null}
      </span>
    </li>
  );
}

function BusinessProfileCard({
  bp,
  onCopy,
}: {
  bp: BusinessProfile;
  onCopy: (text: string, label: string) => void;
}) {
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
          onCopy={onCopy}
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
}

function AccountViewInner({
  clientUser,
  profileComplete,
  userRole,
  isAdmin,
  accountStatus,
  rejectionReason,
  moreOpen,
  setMoreOpen,
  photo,
  uploading,
  uploadPercent,
  onPhotoChange,
  onGoToProfile,
  onCopy,
  onLinkGoogle,
  onLinkPhone,
}: {
  clientUser: UserData;
  profileComplete: boolean | null;
  userRole?: string;
  isAdmin: boolean;
  accountStatus: AccountStatus | null;
  rejectionReason?: string | null;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  photo: string;
  uploading: boolean;
  uploadPercent: number;
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onGoToProfile: () => void;
  onCopy: (text: string, label: string) => void;
  onLinkGoogle: () => Promise<void> | void;
  onLinkPhone: () => Promise<void> | void;
}) {
  const statusInfo = getAccountStatusInfo(accountStatus, rejectionReason);

  return (
    <Card className="mx-auto w-full max-w-6xl p-2 py-4 md:p-4 md:py-6">
      <CardHeader className="p-0">
        <CardTitle className="text-primary p-0 text-center text-xl font-semibold md:text-2xl">
          My Account
        </CardTitle>

        {!isAdmin && profileComplete && (
          <div className="space-y-2">
            <Alert
              className={clsx(
                statusInfo?.bgColor,
                statusInfo?.borderColor,
                "items-start p-2",
              )}
            >
              <AlertDescription
                className={clsx("ml-2 text-sm", statusInfo?.color)}
              >
                <div className="flex w-full flex-col items-center justify-center gap-1 text-xs md:flex-row">
                  <span className="text-sm font-semibold">
                    {statusInfo?.title}
                  </span>{" "}
                  {statusInfo?.description}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="relative flex flex-col items-center justify-center gap-2 py-4">
          <Avatar className="ring-primary h-24 w-24 bg-white p-1 ring-2 md:h-28 md:w-28">
            {photo ? (
              <AvatarImage
                src={photo}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-cyan-800">
                <Image
                  src={DefaultUserIcon}
                  alt="avatar"
                  width={60}
                  height={60}
                  className="rounded-full object-center p-1"
                />
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
                onChange={onPhotoChange}
                style={{ display: "none" }}
              />
              <span className="bg-muted text-primary hover:text-primary/90 cursor-pointer rounded-md px-3 py-1 text-xs">
                Change profile picture
              </span>
            </label>
          )}
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-muted-foreground text-center text-xs">
            Your User ID (UID) in our system:
          </span>
          <span className="text-primary flex items-center justify-center gap-2 text-sm font-semibold">
            {clientUser.userId}
            <CopyIcon
              className="text-primary size-4 cursor-pointer"
              onClick={() => onCopy(clientUser.userId, "UID")}
            />
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0">
        {isAdmin ? (
          <div className="rounded-md bg-green-100 p-2 px-4 text-center text-sm text-green-700">
            You are an <span className="font-semibold">Admin</span> — manage
            everything!
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-md p-2 text-sm">
            You have user access under role:
            <span className="text-primary text-lg font-semibold first-letter:uppercase">
              {userRole || "GUEST"}
            </span>
          </div>
        )}

        {!profileComplete && !isAdmin && (
          <Alert className="flex items-center justify-center border-yellow-200 bg-yellow-50">
            <AlertDescription className="flex flex-col items-start gap-2 text-sm text-yellow-800">
              <div>Your profile is incomplete.</div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToProfile}
                className="gap-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
              >
                Complete profile now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
              onCopy={onCopy}
            />
            <DetailRow
              label="Phone"
              value={clientUser.phone}
              icon={Phone}
              copyValue={clientUser.phone ?? undefined}
              onCopy={onCopy}
            />
            <DetailRow
              label="Business type"
              valueNode={
                <span className="break-all">
                  {titleCase(clientUser.businessType)}
                </span>
              }
              icon={Building2}
            />
            <DetailRow
              label="GST number"
              value={clientUser.gstNumber}
              icon={FileText}
              copyValue={clientUser.gstNumber}
              onCopy={onCopy}
            />
            <DetailRow
              label="PAN number"
              value={clientUser.panNumber}
              icon={FileText}
              copyValue={clientUser.panNumber}
              onCopy={onCopy}
            />
            <DetailRow
              label="Firm/Business Name"
              value={
                clientUser.firmName || clientUser.businessProfile?.legalName
              }
              icon={FileText}
              copyValue={
                clientUser.firmName || clientUser.businessProfile?.legalName
              }
              onCopy={onCopy}
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
          </ul>
        </div>

        {clientUser.firebaseAuth ? (
          <FirebaseAuthMethods
            firebaseAuth={clientUser.firebaseAuth}
            onLinkGoogle={onLinkGoogle}
            onLinkPhone={onLinkPhone}
          />
        ) : null}

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
              <BusinessProfileCard
                bp={clientUser.businessProfile as BusinessProfile}
                onCopy={onCopy}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CardContent>
    </Card>
  );
}

const AccountView = memo(AccountViewInner);
export default AccountView;
