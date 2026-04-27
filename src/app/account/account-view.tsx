"use client";

import React, { memo, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  CopyIcon,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldOff,
  Mail,
  Phone,
  User,
  Building2,
  FileText,
  BadgeCheck,
  BadgeX,
  Hash,
  ArrowRight,
  Pencil,
  PlusCircle,
  Eye,
  ChevronDown,
  BriefcaseBusiness,
  Shield,
  UserPen,
  Truck,
  ClockFading,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import DefaultUserIcon from "@/assets/icons/user.png";

import type { BusinessProfile, UserData } from "@/types/user";

import FirebaseAuthMethods from "./firebase-auth-methods";
import type { AccountStatus } from "@/types/userGate";
import type { UserRole } from "@/types/userGate";
import CropperModal from "@/components/custom/cropper-modal";
import {
  EditNameDialog,
  AddPanDialog,
  AddGstDialog,
} from "./inline-edit-dialogs";
import { AccountTimeline } from "@/components/custom/account-timeline";
import { useAccountTimeline } from "@/hooks/useAccountTimeline";

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
    <span className="wrap-break-word">{formatValue(value)}</span>
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
    <div className="space-y-3">
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
  isAdmin,
  userRole,
  accountStatus,
  rejectionReason,
  photo,
  uploading,
  uploadPercent,
  onPhotoChange,
  cropOpen,
  cropSrc,
  onCropClose,
  onCropDone,
  onGoToProfile,
  onCopy,
  onLinkGoogle,
  onLinkPhone,
  onSaveName,
  onSavePan,
  onSaveGst,
}: {
  clientUser: UserData;
  profileComplete: boolean | null;
  isAdmin: boolean;
  userRole?: UserRole | null;
  accountStatus: AccountStatus | null;
  rejectionReason?: string | null;
  photo: string;
  uploading: boolean;
  uploadPercent: number;
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  cropOpen: boolean;
  cropSrc: string;
  onCropClose: () => void;
  onCropDone: (result: { blobUrl: string; file: File }) => Promise<void>;
  onGoToProfile: () => void;
  onCopy: (text: string, label: string) => void;
  onLinkGoogle: () => Promise<void> | void;
  onLinkPhone: () => Promise<void> | void;
  onSaveName: (name: string) => Promise<void>;
  onSavePan: (pan: string) => Promise<void>;
  onSaveGst: (bp: BusinessProfile) => Promise<void>;
}) {
  const statusInfo = getAccountStatusInfo(accountStatus, rejectionReason);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [addPanOpen, setAddPanOpen] = useState(false);
  const [addGstOpen, setAddGstOpen] = useState(false);
  const [gstDetailsOpen, setGstDetailsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const { events: timelineEvents, loading: timelineLoading } =
    useAccountTimeline(clientUser.uid);

  return (
    <>
      <CropperModal
        open={cropOpen}
        imageSrc={cropSrc}
        onClose={onCropClose}
        onCropComplete={onCropDone}
        aspectRatio={1}
      />
      <EditNameDialog
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        currentName={clientUser.displayName ?? ""}
        onSave={onSaveName}
      />
      <AddPanDialog
        open={addPanOpen}
        onOpenChange={setAddPanOpen}
        onSave={onSavePan}
      />
      <AddGstDialog
        open={addGstOpen}
        onOpenChange={setAddGstOpen}
        onSave={onSaveGst}
      />
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
                <AvatarFallback className="bg-transparent p-0">
                  <Image
                    src={photo}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="h-full w-full rounded-full object-cover"
                    unoptimized={photo.startsWith("blob:")}
                  />
                </AvatarFallback>
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
          {isAdmin
            ? (() => {
                const role = userRole ?? "admin";
                const Icon =
                  role === "accountant"
                    ? UserPen
                    : role === "sales"
                      ? BriefcaseBusiness
                      : role === "dispatcher"
                        ? Truck
                        : Shield;
                const bg =
                  role === "accountant"
                    ? "bg-violet-700"
                    : role === "sales"
                      ? "bg-emerald-700"
                      : role === "dispatcher"
                        ? "bg-amber-600"
                        : "bg-sky-900";
                const desc =
                  role === "admin"
                    ? "Full dashboard access — all sections."
                    : role === "sales"
                      ? "Dashboard access: Enquiry Register + Order Book."
                      : role === "dispatcher"
                        ? "Dashboard access: Order Book."
                        : "Dashboard access: Brand Catalogue + Order Book.";
                return (
                  <div className="flex items-center justify-center gap-3 rounded-md border border-white/20 bg-slate-800 p-3 text-white shadow-sm">
                    <div
                      className={clsx(
                        "flex items-center justify-center rounded-full p-2",
                        bg,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold capitalize">
                        {role} Account
                      </span>
                      <span className="text-xs text-slate-300">{desc}</span>
                    </div>
                  </div>
                );
              })()
            : null}

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
                icon={User}
                valueNode={
                  <span className="flex items-center gap-2">
                    <span className="wrap-break-word">
                      {clientUser.displayName || "-"}
                    </span>
                    {profileComplete && (
                      <button
                        type="button"
                        onClick={() => setEditNameOpen(true)}
                        className="text-muted-foreground hover:text-primary shrink-0"
                        aria-label="Edit display name"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </span>
                }
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
                icon={FileText}
                valueNode={
                  clientUser.gstNumber ? (
                    <span className="flex items-center gap-2">
                      <span className="wrap-break-word">
                        {clientUser.gstNumber}
                      </span>
                      <CopyIcon
                        className="text-primary size-4 shrink-0 cursor-pointer"
                        onClick={() =>
                          onCopy(clientUser.gstNumber!, "GST number")
                        }
                      />
                      {clientUser.businessProfile && (
                        <Button
                          variant={"secondary"}
                          onClick={() => setGstDetailsOpen(true)}
                          className="text-primary hover:text-primary/80 hidden shrink-0 items-center gap-1 text-xs font-medium md:flex"
                        >
                          <Eye className="size-3.5" />
                          View Details
                        </Button>
                      )}
                    </span>
                  ) : !isAdmin && profileComplete ? (
                    <button
                      type="button"
                      onClick={() => setAddGstOpen(true)}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircle className="size-3.5" />
                      Add GST
                    </button>
                  ) : (
                    <span>-</span>
                  )
                }
              />
              {clientUser.gstNumber && clientUser.businessProfile && (
                <li className="md:hidden">
                  <Button
                    variant={"secondary"}
                    onClick={() => setGstDetailsOpen(true)}
                    className="text-primary hover:bg-primary/5 flex w-full items-center gap-2 p-3 text-sm font-medium"
                  >
                    <Eye className="size-4 shrink-0" />
                    View GST Details
                  </Button>
                </li>
              )}
              <DetailRow
                label="PAN number"
                icon={FileText}
                valueNode={
                  clientUser.panNumber ? (
                    <span className="flex items-center gap-2">
                      <span className="wrap-break-word">
                        {clientUser.panNumber}
                      </span>
                      <CopyIcon
                        className="text-primary size-4 shrink-0 cursor-pointer"
                        onClick={() =>
                          onCopy(clientUser.panNumber!, "PAN number")
                        }
                      />
                    </span>
                  ) : !isAdmin && profileComplete ? (
                    <button
                      type="button"
                      onClick={() => setAddPanOpen(true)}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircle className="size-3.5" />
                      Add PAN
                    </button>
                  ) : (
                    <span>-</span>
                  )
                }
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

          {clientUser.gstNumber && clientUser.businessProfile && (
            <Dialog open={gstDetailsOpen} onOpenChange={setGstDetailsOpen}>
              <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                  <DialogTitle>GST Details</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <BusinessProfileCard
                    bp={clientUser.businessProfile as BusinessProfile}
                    onCopy={onCopy}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Account Timeline */}
          <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={"ghost"}
                className="flex w-full items-center justify-between rounded-md py-2 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <ClockFading className="size-4" />
                  Account activity
                  {!timelineLoading && timelineEvents.length > 0 && (
                    <div className="text-muted-foreground text-xs font-normal">
                      {timelineEvents.length} event
                      {timelineEvents.length > 1 ? "s" : ""}
                    </div>
                  )}
                </span>
                <ChevronDown
                  className={clsx(
                    "size-4 transition-transform duration-300",
                    timelineOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-secondary/50 max-h-80 overflow-y-auto rounded-md px-2 py-2">
                <AccountTimeline
                  events={timelineEvents}
                  loading={timelineLoading}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </>
  );
}

const AccountView = memo(AccountViewInner);
export default AccountView;
