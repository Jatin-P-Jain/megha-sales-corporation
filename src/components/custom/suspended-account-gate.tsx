"use client";

import React, { useState } from "react";
import { ShieldOff, Send, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { auth } from "@/firebase/client";
import { useUserGate } from "@/context/UserGateProvider";
import { useAuthState } from "@/context/useAuth";
import { useUserProfileState } from "@/context/UserProfileProvider";
import {
  notifyAdminRecipientsAction,
  notifyUserAction,
} from "@/actions/notify-user";
import { getBaseUrl } from "@/lib/utils";
import { useSafeRouter } from "@/hooks/useSafeRouter";

export default function SuspendedAccountGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accountStatus, gateLoading } = useUserGate();
  const { currentUser, isAdmin } = useAuthState();
  const { clientUser } = useUserProfileState();
  const router = useSafeRouter();

  const [sending, setSending] = useState(false);

  // Don't block: loading state, not logged in, admin, or not suspended
  if (gateLoading || !currentUser || isAdmin || accountStatus !== "suspended") {
    return <>{children}</>;
  }

  const handleRaiseRequest = async () => {
    setSending(true);
    try {
      // Best-effort WA message — don't throw if it fails
      try {
        await fetch("/api/wa-send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateKey: "account_approval_reminder_to_admin",
            customerUserId: clientUser?.userId,
            customerName: clientUser?.displayName || "User",
            customerPhone: clientUser?.phone || "Not provided",
            customerEmail: clientUser?.email || "Not provided",
          }),
        });
      } catch {
        // WA is best-effort; continue
      }

      if (clientUser?.uid) {
        await notifyAdminRecipientsAction({
          recipientsMode: "role-admin-only",
          type: "account",
          title: "🔔 Suspension Appeal Received",
          body: `${clientUser.displayName || "User"} is requesting their suspension to be lifted.`,
          url: "/admin-dashboard/users",
          clickAction: "manage_users",
          status: "pending",
          source: "system",
          metadata: {
            customerUid: clientUser.uid,
            customerUserId: clientUser.userId || "",
          },
        });

        await notifyUserAction({
          uid: clientUser.uid,
          type: "account",
          title: "🛎️ Appeal Sent",
          body: "Your suspension appeal has been sent to the admin. We'll review it shortly.",
          url: `${getBaseUrl()}/account`,
          clickAction: "view_account",
          status: "pending",
          source: "system",
        });
      }

      toast.success("Appeal sent!", {
        description: "Your request has been forwarded to the admin.",
      });
    } catch (error) {
      console.error("Error sending appeal:", error);
      toast.error("Failed to send appeal", {
        description: "Please try again or contact support directly.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-orange-100 p-4">
          <ShieldOff className="size-10 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-orange-700">Account Suspended</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Your account has been temporarily suspended. Please contact our team
          to have your access reinstated.
        </p>
        <p className="text-muted-foreground max-w-sm text-xs">
          You can raise a reinstatement request below and our admin will review
          it as soon as possible.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          onClick={handleRaiseRequest}
          disabled={sending}
          className="w-full"
        >
          {sending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Raise a Reinstatement Request
            </>
          )}
        </Button>

        <Button variant="outline" onClick={handleSignOut} className="w-full">
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
