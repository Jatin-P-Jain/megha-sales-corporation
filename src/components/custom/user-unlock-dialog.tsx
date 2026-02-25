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
import { AlertCircle, ChevronsRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/utils";
import { formatBusinessProfile } from "@/lib/business-profile-formatter";
import { useUserGate } from "@/context/UserGateProvider";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { useSafeRouter } from "@/hooks/useSafeRouter";

interface UserUnlockDialogProps {
  children: React.ReactNode;
}

export default function UserUnlockDialog({ children }: UserUnlockDialogProps) {
  const router = useSafeRouter();
  const { profileComplete } = useUserGate();
  useRequireUserProfile(true); // Ensure profile is loaded and complete status is accurate
  const { clientUser } = useUserProfileState();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleCompleteProfile = async () => {
    router.push("/account/profile");
  };
  const handleRequestApproval = async () => {
    setSending(true);
    try {
      const waResp = await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "account_approval_reminder_to_admin",
          customerUserId: clientUser?.userId,
          customerName: clientUser?.displayName || "User",
          customerPhone: clientUser?.phone || "Not provided",
          customerEmail: clientUser?.email || "Not provided",
          customerBusinessProfile: formatBusinessProfile(clientUser),
        }),
      });

      if (!waResp.ok) {
        throw new Error("Failed to send WhatsApp message");
      }

      await fetch("/api/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: clientUser?.uid,
          title: "🛎️ Approval Request Sent",
          body: `Your approval request has been sent to the admin.`,
          url: `${getBaseUrl()}/account`,
          clickAction: "view_account",
          status: "created",
        }),
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

      {profileComplete ? (
        <DialogContent className="p-2 md:p-4">
          <DialogHeader className="p-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <DialogTitle className="text-lg md:text-xl">
                Account Pending Approval
              </DialogTitle>
            </div>

            <DialogDescription className="text-xs md:text-base">
              To give you the best pricing and protect our business network, we
              review new accounts before enabling full access. Once approved,
              everything unlocks automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm">
            <h4 className="text-sm font-semibold text-yellow-800">
              What&apos;s temporarily unavailable (until approval)
            </h4>

            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Viewing product discounts and special pricing</li>
              <li>• Adding items to the cart / building a cart</li>
              <li>• Placing orders (checkout)</li>
            </ul>

            <p className="text-xs text-yellow-700 italic">
              Requesting approval via WhatsApp helps our team verify your
              details faster, so you can start ordering sooner.
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
                  Sending request...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Request approval on WhatsApp
                </>
              )}
            </Button>

            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="w-full"
            >
              Not now
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="p-2 md:p-4">
          <DialogHeader className="p-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <DialogTitle className="text-lg md:text-xl">
                Profile Incomplete
              </DialogTitle>
            </div>

            <DialogDescription className="text-xs md:text-base">
              Please complete your profile information before requesting account
              approval. This helps us verify your details and speeds up the
              approval process.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm">
            <h4 className="text-sm font-semibold text-yellow-800">
              What&apos;s temporarily unavailable
            </h4>

            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Viewing product discounts and special pricing</li>
              <li>• Adding items to the cart / building a cart</li>
              <li>• Placing orders (checkout)</li>
            </ul>

            <p className="text-xs text-yellow-700 italic">
              Please update your profile with all required information, then you
              can request approval to unlock full access.
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleCompleteProfile}
              disabled={sending}
              className="w-full"
            >
              Complete Profile Now <ChevronsRight className="size-4" />
            </Button>

            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="w-full"
            >
              I will complete later
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
