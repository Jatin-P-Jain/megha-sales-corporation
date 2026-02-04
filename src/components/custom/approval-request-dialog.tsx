"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";
import { getBaseUrl } from "@/lib/utils";
import { formatBusinessProfile } from "@/lib/business-profile-formatter";

interface ApprovalRequestDialogProps {
  children: React.ReactNode;
}

export default function ApprovalRequestDialog({
  children,
}: ApprovalRequestDialogProps) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleRequestApproval = async () => {
    setSending(true);
    try {
      // Call API to send WhatsApp notification to admin
      const waResp = await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "account_approval_request",
          adminName: "Jatin", // Or get from config
          customerName: auth.clientUser?.displayName || "User",
          customerPhone: auth.clientUser?.phone || "Not provided",
          customerEmail: auth.clientUser?.email || "Not provided",
          businessProfile: formatBusinessProfile(
            auth.clientUser?.businessProfile,
          ),
        }),
      });
      if (!waResp.ok) {
        throw new Error("Failed to send WhatsApp message");
      }
      await fetch("/api/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: auth.clientUser?.uid,
          title: "🛎️ Approval Request Sent",
          body: `Your approval request has been sent to the admin.`,
          url: `${getBaseUrl()}/account`,
          clickAction: "view_account",
          status: "created",
        }),
      });
      toast.success("Request Sent!", {
        description:
          "Your approval request has been sent to the admin. You'll be notified once approved.",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error requesting approval:", error);
      toast.error("Failed to send request", {
        description: "Please try again or contact support directly.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <DialogTitle className="text-xl">
              Account Pending Approval
            </DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Your account is currently under review by our admin team. Product
            discounts are hidden until your account is approved.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="mb-2 font-semibold text-yellow-800">
            Why can&apos;t I see discounts?
          </h4>
          <p className="text-sm text-yellow-700">
            To maintain pricing integrity and ensure genuine business
            relationships, we verify all new accounts before granting full
            access to our pricing and discount information.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleRequestApproval}
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending Request...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Request Approval via WhatsApp
              </>
            )}
          </Button>

          <Button
            onClick={() => setOpen(false)}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
