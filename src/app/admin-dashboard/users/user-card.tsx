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
  IdCard,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface UserCardProps {
  user: UserData;
  onStatusUpdate?: () => void;
}

export default function UserCard({ user, onStatusUpdate }: UserCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          action: "approve",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve user");
      }

      toast.success("User Approved!", {
        description: `${user.displayName}'s account has been approved successfully.`,
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user", {
        description: "Please try again or contact support.",
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
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject user");
      }

      toast.success("User Rejected", {
        description: `${user.displayName}'s account has been rejected.`,
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = () => {
    switch (user.accountStatus) {
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

  return (
    <>
      <Card className="gap-1 overflow-hidden p-0">
        <CardHeader className="bg-primary/10 p-2">
          <div className="flex items-start justify-between">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                  {user.photoUrl ? (
                    <AvatarImage
                      src={user.photoUrl}
                      alt={user.displayName || ""}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/90 text-lg text-white">
                      {user.displayName?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col items-start justify-center gap-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {user.displayName || "Unnamed User"}
                    {user.userType === "admin" && (
                      <Badge variant="default" className="bg-sky-900">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </CardTitle>
                  {user.userType !== "admin" && (
                    <div className="flex items-center gap-2">
                      {getStatusBadge()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                {/* Action Buttons */}
                {user.accountStatus !== "approved" &&
                  user.userType !== "admin" && (
                    <>
                      <div className="flex gap-2">
                        {user.accountStatus === "pending" && (
                          <>
                            <Button
                              onClick={handleApprove}
                              disabled={isApproving}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {isApproving ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => setShowRejectDialog(true)}
                              disabled={isRejecting}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {user.accountStatus === "rejected" && (
                          <Button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isApproving ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2">
          {/* Basic Information */}
          <div className="space-y-1">
            <div className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>UID:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  {user.uid}
                </span>
                <CopyIcon
                  className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => copyToClipboard(user.uid, "UID")}
                />
              </div>
            </div>

            <div className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>Email:</span>
              </div>
              <span className="text-sm font-semibold">
                {user.email || "N/A"}
              </span>
            </div>

            <div className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>Phone:</span>
              </div>
              <span className="text-sm font-semibold">
                {user.phone || "N/A"}
              </span>
            </div>

            <div className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>Business Type:</span>
              </div>
              <span className="text-sm font-semibold capitalize">
                {user.businessType || "N/A"}
              </span>
            </div>

            {user.gstNumber && (
              <div className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
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
                    onClick={() =>
                      copyToClipboard(user.gstNumber!, "GST Number")
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Business Profile Accordion */}
          {user.businessProfile && (
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="business-profile" className="border-none">
                  <AccordionTrigger className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-100 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Business Profile Details</span>
                      {user.businessProfile?.gstin && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-green-500 text-xs text-green-700"
                        >
                          ✓ GST Verified
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Rejection Reason */}
          {user.accountStatus === "rejected" && user.rejectionReason && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
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
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {user.displayName}'s
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
    </>
  );
}
