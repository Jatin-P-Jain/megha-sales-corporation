"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
  Building2,
  Shield,
  CopyIcon,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { UserData } from "@/types/user";
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

interface UserCardProps {
  user: UserData;
  onStatusUpdate?: () => void;
}

export default function UserCard({ user, onStatusUpdate }: UserCardProps) {
  // Widen status to allow extra states like "revoked" / "deleted" without TS narrowing issues.
  const accountStatus = (user.accountStatus ?? "pending") as string;
  const isAdmin = user.userType === "admin";

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "approved",
        rejectionReason: "",
      });

      toast.success("User Approved!", {
        description: `${user.displayName}'s account has been approved successfully.`,
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user", {
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

  // Soft delete: set status to "deactivated". Ensure your backend supports this status.
  const handleSoftDelete = async () => {
    setIsDeleting(true);
    try {
      await updateUserAccountStatus({
        userId: user.uid,
        accountStatus: "deactivated",
        rejectionReason: "",
      });

      toast.success("Account deactivated", {
        description: `${user.displayName}'s account status has been set to deactivated.`,
      });

      setShowDeleteDialog(false);
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error deactivating (soft) user:", error);
      toast.error("Failed to deactivate account", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
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
      case "deactivated":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
            <Trash2 className="h-3 w-3" />
            Deactivated
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
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

  const canShowActions = !isAdmin && accountStatus !== "deactivated";
  const showPrimaryApprove =
    canShowActions && (accountStatus === "pending" || accountStatus === "rejected" || accountStatus === "suspended");

  const revokeEnabled = accountStatus === "approved";

  return (
    <>
      <Card className="gap-0 overflow-hidden p-0">
        <CardHeader className="bg-primary/10 p-2 md:p-3">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                {user.photoUrl ? (
                  <AvatarImage src={user.photoUrl} alt={user.displayName || ""} />
                ) : (
                  <AvatarFallback className="bg-primary/90 text-lg text-white">
                    {user.displayName?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {user.displayName || "Unnamed User"}
                  {isAdmin && (
                    <Badge variant="default" className="bg-sky-900">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </CardTitle>

                {!isAdmin && (
                  <div className="flex items-center gap-2">
                    {getStatusBadge()}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: primary + dropdown */}
            {canShowActions && (
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                {showPrimaryApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 md:w-auto"
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full md:w-auto"
                      disabled={isApproving || isRejecting || isSuspending || isDeleting}
                    >
                      Actions
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Reject (only relevant for pending) */}
                    {accountStatus === "pending" && (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    )}

                    {/* Revoke access (only meaningful for approved) */}
                    <DropdownMenuItem
                      disabled={!revokeEnabled}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (!revokeEnabled) return;
                        setShowSuspendDialog(true);
                      }}
                    >
                      <ShieldOff className="h-4 w-4" />
                      Suspend Account
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Soft delete */}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete account (soft)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Collapsible View Details Button */}
        <div
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className={clsx(
            "flex cursor-pointer items-center justify-between px-4 py-2 transition-colors hover:bg-gray-50",
            isDetailsOpen && "bg-gray-100"
          )}
        >
          <span className="text-sm font-medium text-gray-700">View Details</span>
          {isDetailsOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </div>

        {/* Collapsible Details Section */}
        {isDetailsOpen && (
          <CardContent className="space-y-1 p-4">
            {/* UID */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>UID:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{user.uid}</span>
                <CopyIcon
                  className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(user.uid, "UID");
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
              <span className="text-sm font-semibold">{user.email || "N/A"}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>Phone:</span>
              </div>
              <span className="text-sm font-semibold">{user.phone || "N/A"}</span>
            </div>

            {/* User Type */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>User Type:</span>
              </div>
              <span className="text-sm font-semibold capitalize">
                {user.userType || "N/A"}
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

            {/* Account Status */}
            {user.accountStatus && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Account Status:</span>
                </div>
                {getStatusBadge()}
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
                                )
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
            <AlertDialogCancel disabled={isSuspending}>Cancel</AlertDialogCancel>
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

      {/* Soft delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account (soft)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {user.displayName || "this user"} as deleted.
              The user won&apos;t be removed permanently, only the status changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleSoftDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Delete (soft)"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
