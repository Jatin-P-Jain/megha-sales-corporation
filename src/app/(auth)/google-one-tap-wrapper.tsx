"use client";

import GoogleOneTap from "@/components/custom/google-one-tap";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/useAuth";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

export default function GoogleOneTapWrapper() {
  const { currentUser, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  // Show nothing while auth is loading
  if (loading) return null;
  // Don't show One Tap if user is already logged in
  if (currentUser) return null;

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

  return <GoogleOneTap setSigningIn={setSigningIn} />;
}
