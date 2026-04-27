"use client";

import { useState } from "react";
import { auth as firebaseAuth } from "@/firebase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
  Building2,
  Shield,
  ShieldCheck,
  CopyIcon,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ShieldOff,
  TriangleAlert,
  BriefcaseBusiness,
  UserCheck2,
  ContactRound,
  UserPen,
  Truck,
  Undo2,
} from "lucide-react";
import { FullUser } from "@/types/user";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { updateUserAccountStatus } from "@/app/account/actions";
import { updateUserRole } from "@/app/account/actions";
import type { UserRole } from "@/types/userGate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import DefaultUserIcon from "@/assets/icons/user.png";

interface UserCardProps {
  user: FullUser;
  canAssignRoles?: boolean;
  onStatusUpdate?: () => void;
}

export default function UserCard({
  user,
  canAssignRoles = false,
  onStatusUpdate,
}: UserCardProps) {
  // Widen status to allow extra states like "revoked" / "deleted" without TS narrowing issues.
  const accountStatus = (user.accountStatus ?? "pending") as string;
  const isAdmin = user.userRole !== "customer";
  const profileComplete = !!user.profileComplete;

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isUnsuspending, setIsUnsuspending] = useState(false);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    user.userRole ?? "customer",
  );
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading("Approving account…", {
      description: `Processing approval for ${user.displayName || "this user"}.`,
    });
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "approved",
        rejectionReason: "",
      });

      toast.success("User Approved!", {
        id: toastId,
        description: `${user.displayName}'s account has been approved successfully.`,
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user", {
        id: toastId,
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setIsRejecting(true);
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "rejected",
        rejectionReason: rejectionReason.trim(),
      });

      toast.success("User Rejected", {
        description: `${user.displayName}'s account has been rejected.`,
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    const toastId = toast.loading("Revoking approval…", {
      description: `Resetting ${user.displayName || "this user"}'s account to pending.`,
    });
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "pending",
        rejectionReason: "",
        resetRoleToCustomer: true,
        notificationOverride: {
          title: "⏳ Approval Revoked",
          body: "Your account approval has been revoked and your role has been reset. Your account is under review again.",
        },
        timelineOverride: {
          type: "account_revoked",
          label: "Approval revoked",
        },
      });

      toast.success("Approval revoked", {
        id: toastId,
        description: `${user.displayName}'s approval has been revoked. Role reset to customer and account moved to pending.`,
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error revoking approval:", error);
      toast.error("Failed to revoke approval", {
        id: toastId,
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleUnsuspend = async () => {
    setIsUnsuspending(true);
    const toastId = toast.loading("Reinstating account…", {
      description: `Lifting suspension for ${user.displayName || "this user"}.`,
    });
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "approved",
        rejectionReason: "",
        notificationOverride: {
          title: "✅ Account Reinstated",
          body: "Your account suspension has been lifted. You can now access all features.",
        },
        timelineOverride: {
          type: "account_unsuspended",
          label: "Account unsuspended",
        },
      });

      toast.success("Account reinstated", {
        id: toastId,
        description: `${user.displayName}'s suspension has been lifted.`,
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error unsuspending account:", error);
      toast.error("Failed to reinstate account", {
        id: toastId,
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
      });
    } finally {
      setIsUnsuspending(false);
    }
  };

  // Suspend Access. Ensure your backend supports this status.
  const handleSuspend = async () => {
    setIsSuspending(true);
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "suspended",
        rejectionReason: "",
      });

      toast.success("Access suspended", {
        description: `${user.displayName}'s access has been suspended.`,
      });

      setShowSuspendDialog(false);
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error suspending access:", error);
      toast.error("Failed to suspend access", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
      });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleAssignRole = async () => {
    if (selectedRole !== "customer" && accountStatus !== "approved") {
      toast.error("Cannot assign staff role", {
        description: "Approve this account first, then assign a staff role.",
      });
      return;
    }

    setIsAssigningRole(true);
    try {
      await updateUserRole({
        targetUserId: user.uid,
        userRole: selectedRole,
      });
      // If the admin updated their own role, force-refresh their JWT so the new
      // claims are reflected immediately in server components and middleware.
      if (firebaseAuth.currentUser?.uid === user.uid) {
        await firebaseAuth.currentUser.getIdToken(true);
      }
      toast.success("Role updated", {
        description: `${user.displayName || "User"}'s role has been updated to ${selectedRole}. They'll see server-side changes after re-login.`,
      });
      setShowRoleDialog(false);
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to update role", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsAssigningRole(false);
    }
  };

  const getStatusBadge = (showPending: boolean) => {
    switch (accountStatus) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
            <ShieldOff className="h-3 w-3" />
            Suspended
          </Badge>
        );
      default:
        return showPending ? (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        ) : null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const canShowActions = !isAdmin && profileComplete;

  return (
    <>
      <Card className="gap-0! overflow-hidden p-0">
        <CardHeader className="bg-primary/10 gap-0 p-2">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-start">
            <div className="flex w-full items-center gap-2">
              <Avatar className="size-10 border-2 border-white shadow-md">
                {user.photoUrl ? (
                  <AvatarFallback className="bg-transparent p-0">
                    <Image
                      src={user.photoUrl}
                      alt={user.displayName || ""}
                      width={48}
                      height={48}
                      className="h-full w-full rounded-full object-cover"
                      unoptimized={user.photoUrl.startsWith("blob:")}
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

              <div className="flex w-full flex-1 items-start justify-between gap-1">
                <div className="flex w-full flex-col gap-1">
                  <CardTitle className="flex w-full items-center justify-between gap-2 md:text-lg">
                    <div className="flex w-full flex-col items-start gap-1">
                      {user.displayName ? (
                        <div className="flex w-full items-center gap-1">
                          {user.displayName}
                        </div>
                      ) : (
                        <div className="text-sm">
                          {user.phone
                            ? `${user.phone}`
                            : user.email
                              ? `${user.email}`
                              : ""}
                        </div>
                      )}
                      {user.firmName && (
                        <div className="text-primary w-full text-xs tracking-wide uppercase md:text-sm">
                          ({user.firmName})
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Badge
                        variant="default"
                        className={clsx(
                          "border border-white py-1.5 font-medium shadow-md",
                          user.userRole === "accountant"
                            ? "bg-olive-600"
                            : user.userRole === "sales"
                              ? "bg-emerald-700"
                              : user.userRole === "dispatcher"
                                ? "bg-amber-700"
                                : "bg-sky-900",
                        )}
                      >
                        {user.userRole === "accountant" ? (
                          <UserPen className="size-4" />
                        ) : user.userRole === "sales" ? (
                          <BriefcaseBusiness className="size-4" />
                        ) : user.userRole === "dispatcher" ? (
                          <Truck className="size-4" />
                        ) : (
                          <Shield className="size-4" />
                        )}
                        <span className="inline-flex text-[10px]">
                          {user.userRole.charAt(0).toUpperCase() +
                            user.userRole.slice(1)}
                        </span>
                      </Badge>
                    )}
                  </CardTitle>

                  {!isAdmin && (
                    <div className="flex flex-wrap items-center gap-1">
                      {getStatusBadge(false)}
                      {!profileComplete && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <TriangleAlert className="h-3 w-3" />
                          Incomplete Profile
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="hidden md:flex">
                  {canShowActions && (
                    <div className="flex w-full flex-wrap gap-2 md:w-fit">
                      {/* Approve toggle: pending/rejected → Approve; approved → Revoke */}
                      {(accountStatus === "pending" ||
                        accountStatus === "rejected") && (
                        <Button
                          onClick={handleApprove}
                          disabled={
                            isApproving ||
                            isRevoking ||
                            isSuspending ||
                            isUnsuspending
                          }
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 md:flex-none"
                        >
                          {isApproving ? (
                            <>
                              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Approve
                            </>
                          )}
                        </Button>
                      )}

                      {accountStatus === "approved" && (
                        <Button
                          onClick={handleRevoke}
                          disabled={
                            isRevoking ||
                            isApproving ||
                            isSuspending ||
                            isUnsuspending
                          }
                          size="sm"
                          variant="outline"
                          className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50 md:flex-none"
                        >
                          {isRevoking ? (
                            <>
                              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <ShieldOff className="mr-1 h-3 w-3" />
                              Revoke Approval
                            </>
                          )}
                        </Button>
                      )}

                      {/* Unsuspend toggle */}
                      {accountStatus === "suspended" && (
                        <Button
                          onClick={handleUnsuspend}
                          disabled={
                            isUnsuspending ||
                            isApproving ||
                            isRevoking ||
                            isSuspending
                          }
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 md:flex-none"
                        >
                          {isUnsuspending ? (
                            <>
                              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Reinstating...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              Unsuspend
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-auto justify-between"
                      disabled={
                        isApproving ||
                        isRejecting ||
                        isRevoking ||
                        isSuspending ||
                        isUnsuspending
                      }
                    >
                      <span className="md:inlex-flex hidden">Actions</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="flex w-56 flex-col gap-0.5"
                  >
                    <DropdownMenuLabel>Account actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Role assignment — only for full admins */}
                    {canAssignRoles && accountStatus === "approved" && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedRole(user.userRole ?? "customer");
                          setShowRoleDialog(true);
                        }}
                        className="bg-cyan-50 font-medium text-cyan-800"
                      >
                        <ShieldCheck className="h-4 w-4 text-cyan-800" />
                        Assign Role
                      </DropdownMenuItem>
                    )}

                    {/* Reject (only relevant for pending) */}
                    {accountStatus === "pending" && profileComplete && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setShowRejectDialog(true);
                        }}
                        className="bg-rose-50 font-medium text-rose-900"
                      >
                        <XCircle className="h-4 w-4 text-rose-900" />
                        Reject
                      </DropdownMenuItem>
                    )}

                    {accountStatus === "pending" && !profileComplete && (
                      <span className="text-muted-foreground flex flex-1 justify-center text-xs italic">
                        No actions available
                      </span>
                    )}

                    {accountStatus === "approved" && (
                      <DropdownMenuItem
                        onSelect={() => {
                          handleRevoke();
                        }}
                        className="bg-yellow-50 font-medium text-yellow-700 md:hidden"
                      >
                        <Undo2 className="h-4 w-4 text-yellow-700" />
                        Revoke Approval
                      </DropdownMenuItem>
                    )}

                    {/* Suspend (only for approved) */}
                    {accountStatus === "approved" && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setShowSuspendDialog(true);
                        }}
                        className="bg-red-50 font-medium text-red-800"
                      >
                        <ShieldOff className="h-4 w-4 text-red-800" />
                        Suspend Account
                      </DropdownMenuItem>
                    )}
                    {accountStatus === "suspended" && (
                      <DropdownMenuItem
                        onSelect={() => {
                          handleUnsuspend();
                        }}
                        className="bg-emerald-50 font-medium text-emerald-900"
                      >
                        <ShieldOff className="h-4 w-4 text-emerald-900" />
                        Unsuspend Account
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex w-full md:hidden">
              {canShowActions && (
                <div className="flex w-full flex-wrap gap-2 md:w-fit">
                  {/* Approve toggle: pending/rejected → Approve; approved → Revoke */}
                  {(accountStatus === "pending" ||
                    accountStatus === "rejected") && (
                    <Button
                      onClick={handleApprove}
                      disabled={
                        isApproving ||
                        isRevoking ||
                        isSuspending ||
                        isUnsuspending
                      }
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 md:flex-none"
                    >
                      {isApproving ? (
                        <>
                          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Approve
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Collapsible View Details Button */}
        <div
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className={clsx(
            "flex cursor-pointer items-center justify-between p-2 transition-colors hover:bg-gray-50",
            isDetailsOpen && "bg-gray-100",
          )}
        >
          <span className="text-sm font-medium text-gray-700">
            View Details
          </span>
          {isDetailsOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </div>

        {/* Collapsible Details Section */}
        {isDetailsOpen && (
          <CardContent className="space-y-1 p-2">
            {/* UID */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>UID:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  {user.userId}
                </span>
                <CopyIcon
                  className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(user.userId, "UID");
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>Email:</span>
              </div>
              <span className="text-sm font-semibold">
                {user.email || "N/A"}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>Phone:</span>
              </div>
              <span className="text-sm font-semibold">
                {user.phone || "N/A"}
              </span>
            </div>

            {/* Profile Complete status */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ContactRound className="h-4 w-4" />
                <span>Profile Status:</span>
              </div>
              {profileComplete ? (
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <UserCheck2 className="size-4" />
                  Complete
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                  <TriangleAlert className="size-4" />
                  Incomplete
                </div>
              )}
            </div>

            {/* User Type */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>User Type:</span>
              </div>
              <span className="text-sm font-semibold capitalize">
                {user.userRole || "N/A"}
              </span>
            </div>

            {/* Business Type */}
            {user.businessType && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>Business Type:</span>
                </div>
                <span className="text-sm font-semibold capitalize">
                  {user.businessType}
                </span>
              </div>
            )}

            {/* GST Number */}
            {user.gstNumber && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>GST Number:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {user.gstNumber}
                  </span>
                  <CopyIcon
                    className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(user.gstNumber!, "GST Number");
                    }}
                  />
                </div>
              </div>
            )}

            {/* PAN Number */}
            {user.panNumber && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>PAN Number:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {user.panNumber}
                  </span>
                  <CopyIcon
                    className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(user.panNumber!, "PAN Number");
                    }}
                  />
                </div>
              </div>
            )}
            {/* Firm Name */}
            {user.firmName && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Firm Name:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {user.firmName}
                  </span>
                </div>
              </div>
            )}

            {/* Account Status */}
            {user.accountStatus && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Account Status:</span>
                </div>
                {getStatusBadge(true)}
              </div>
            )}

            {/* Business Profile */}
            {user.businessProfile && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <Building2 className="h-4 w-4" />
                    <span>Business Profile Details</span>
                    {user.businessProfile?.gstin && (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-xs text-green-700"
                      >
                        ✓ GST Verified
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">GSTIN:</span>
                        <p className="font-mono font-semibold">
                          {user.businessProfile.gstin || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p className="font-semibold">
                          {user.businessProfile.status || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Legal Name:</span>
                        <p className="font-semibold">
                          {user.businessProfile.legalName || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Trade Name:</span>
                        <p className="font-semibold">
                          {user.businessProfile.tradeName || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Address:</span>
                        <p className="font-semibold text-gray-700">
                          {user.businessProfile.address || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          Registration Date:
                        </span>
                        <p className="font-semibold">
                          {formatDate(user.businessProfile.registrationDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Verified On:</span>
                        <p className="font-semibold">
                          {formatDate(user.businessProfile.verifiedAt)}
                        </p>
                      </div>
                      {user.businessProfile.natureOfBusiness &&
                        user.businessProfile.natureOfBusiness.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">
                              Nature of Business:
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {user.businessProfile.natureOfBusiness.map(
                                (business, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {business}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Rejection Reason */}
            {accountStatus === "rejected" && user.rejectionReason && (
              <>
                <Separator className="my-2" />
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Rejection Reason:
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        {user.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Reject Dialog (with reason) */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {user.displayName}&apos;s
              account. This will be shared with the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Incomplete business verification, Invalid GST details, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Rejecting...
                </>
              ) : (
                "Reject Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend confirmation */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend access for {user.displayName || "this user"}.
              You can later approve again to restore access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSuspending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={isSuspending}
              >
                {isSuspending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Suspending...
                  </>
                ) : (
                  "Suspend access"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff Role</DialogTitle>
            <DialogDescription>
              Set a staff role for{" "}
              <strong>{user.displayName || "this user"}</strong>. Staff roles
              grant access to the admin dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {(
              [
                {
                  value: "customer" as const,
                  label: "No special role",
                  desc: "Regular customer account. No dashboard access.",
                },
                {
                  value: "admin" as const,
                  label: "Admin",
                  desc: "Full dashboard access — all sections.",
                },
                {
                  value: "dispatcher" as const,
                  label: "Dispatcher",
                  desc: "Order Book access only.",
                },
                {
                  value: "accountant" as const,
                  label: "Accountant",
                  desc: "Order Book + Brands Management.",
                },
                {
                  value: "sales" as const,
                  label: "Sales",
                  desc: "Order Book + Enquiry Register.",
                },
              ] satisfies { value: UserRole; label: string; desc: string }[]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedRole(option.value)}
                className={clsx(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedRole === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50",
                )}
              >
                <div
                  className={clsx(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                    selectedRole === option.value
                      ? "border-primary"
                      : "border-gray-300",
                  )}
                >
                  {selectedRole === option.value && (
                    <div className="bg-primary h-2 w-2 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-muted-foreground text-xs">{option.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              disabled={isAssigningRole}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={isAssigningRole}>
              {isAssigningRole ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
