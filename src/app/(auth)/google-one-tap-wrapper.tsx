"use client";

import GoogleOneTap from "@/components/custom/google-one-tap";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/useAuth";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function GoogleOneTapWrapper() {
  const auth = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect") || undefined;

  const nextPath = useMemo(() => {
    if (!auth.clientUser) return null;
    const profileComplete = auth.clientUser.profileComplete;
    if (!profileComplete) return "/account/profile?from=login";
    return redirect ?? "/";
  }, [auth.clientUser, redirect]);

  // ✅ Wait for clientUser to be loaded after login before redirecting
  useEffect(() => {
    if (!loginSuccess) return;
    if (auth.clientUserLoading) return;
    if (!nextPath) return;

    // IMPORTANT: do a full navigation so middleware sees the new cookies immediately
    window.location.assign(nextPath);

    // Reset the flag (won't usually run because of navigation, but safe)
    setLoginSuccess(false);
  }, [loginSuccess, auth.clientUserLoading, nextPath]);

  if (signingIn)
    return (
      <Dialog open>
        <DialogContent
          dialogOverlayClassName="backdrop-blur-sm"
          className="text-primary flex flex-col items-center justify-center gap-4"
          noCloseButton
        >
          <DialogTitle className="m-0 p-0 text-lg font-medium">
            Signing you in...
          </DialogTitle>
          <Loader2Icon className="z-100 flex size-10 animate-spin" />
          <span className="text-sm">
            Hold on a moment — signing in to the account.
          </span>
        </DialogContent>
      </Dialog>
    );

  return (
    <GoogleOneTap
      setSigningIn={setSigningIn}
      setLoginSuccess={setLoginSuccess}
    />
  );
}
