"use client";

import {
  Loader2Icon,
  OctagonAlert,
  RefreshCw,
  Repeat2,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import UserUnlockDialog from "@/components/custom/user-unlock-dialog";
import { Button } from "@/components/ui/button";
import { PushHandler } from "@/lib/firebase/push-handler";

import { useAuthState } from "@/context/useAuth";
import { useUserGate } from "@/context/UserGateProvider";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";

export default function HomeUserBar() {
  // Home needs the full profile
  useRequireUserProfile(true);

  const { currentUser, isAdmin } = useAuthState();
  const { gate, gateLoading, gateSyncing } = useUserGate();

  // NOTE: this assumes your UserProfileManagerProvider exports { user, loading }
  // If your state shape is different, rename accordingly.
  const { clientUser, clientUserLoading } = useUserProfileState();

  // Greeting: best-effort (don’t block UI)
  const userName = clientUser?.displayName;
  const userPhone = clientUser?.phone;
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌤️ Good morning,";
    if (hour < 17) return "☀️ Good afternoon,";
    if (hour < 24) return "🌙 Good evening,";
    return "🌌Good night,";
  })();
  const accountStatus = gate?.accountStatus;
  const rejectionReason = gate?.rejectionReason;
  const profileComplete = !!gate?.profileComplete;

  // Only show blocking loader when user is logged in BUT gate not resolved at all yet
  const showBlockingLoader = !!currentUser && gateLoading && !gate;

  return (
    <>
      <PushHandler />

      {showBlockingLoader ? (
        <div className="bg-muted text-muted-foreground mx-auto flex h-full flex-col items-center justify-center gap-4 rounded-lg p-4">
          <Loader2Icon className="size-5 animate-spin" />
          <span className="text-sm font-semibold">
            Loading your access status…
          </span>
        </div>
      ) : (
        <div className="flex w-full items-center justify-between gap-4">
          <h1 className="flex w-full items-center gap-1 text-sm font-semibold md:text-lg">
            {greeting}{" "}
            <span className="text-lg font-bold md:text-xl">
              {userName || userPhone || "Guest"}
            </span>
            {currentUser && gateSyncing && (
              <span className="text-muted-foreground ml-2 flex animate-pulse gap-2 text-xs font-medium">
                <Repeat2 className="size-4 animate-spin" />
                Syncing…
              </span>
            )}
            {currentUser && clientUserLoading && (
              <span className="text-muted-foreground ml-2 flex gap-2 text-xs font-medium">
                <RefreshCw className="size-4 animate-spin" />
                Loading profile…
              </span>
            )}
          </h1>

          {profileComplete && !isAdmin && accountStatus === "pending" && (
            <UserUnlockDialog>
              <Button
                variant="secondary"
                className="flex items-center justify-center gap-3 rounded-lg border-1 border-yellow-700 p-1 px-2 text-center text-sm font-semibold text-yellow-700 shadow-md"
              >
                <TriangleAlert className="size-4" />
                <span className="hidden md:inline-flex">
                  Account Pending Approval
                </span>
              </Button>
            </UserUnlockDialog>
          )}

          {currentUser && !profileComplete && (
            <UserUnlockDialog>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center justify-center border-1 border-yellow-600 bg-yellow-50 text-xs text-yellow-700 shadow-sm hover:bg-yellow-100"
              >
                <OctagonAlert className="size-5" />
                <span className="hidden md:inline-flex">
                  Incomplete Profile
                </span>
              </Button>
            </UserUnlockDialog>
          )}

          {accountStatus === "rejected" && (
            <Alert className="border-red-700 bg-red-50 text-red-700">
              <XCircle className="h-4 w-4 text-red-700" />
              <AlertDescription className="ml-2 text-sm text-red-700">
                <span className="font-semibold">{rejectionReason}</span>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  );
}
