// app/(auth)/google-one-tap-wrapper.tsx
"use client";

import GoogleOneTap from "@/components/custom/google-one-tap";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuthState } from "@/context/useAuth";
import { Loader2Icon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const AUTH_PAGES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

export default function GoogleOneTapWrapper() {
  const { clientUser, clientUserLoading } = useAuthState(); // ✅ state only

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [signingIn, setSigningIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const redirectedRef = useRef(false);

  const shouldShowOneTap = useMemo(() => {
    if (AUTH_PAGES.has(pathname)) return false;
    if (clientUserLoading) return false;
    if (clientUser) return false;
    return true;
  }, [pathname, clientUserLoading, clientUser]);

  const redirect = searchParams.get("redirect") || undefined;

  const nextPath = useMemo(() => {
    if (!clientUser) return null;
    if (!clientUser.profileComplete) return "/account/profile?from=login";
    return redirect ?? "/";
  }, [clientUser, redirect]);

  useEffect(() => {
    if (!loginSuccess) return;
    if (clientUserLoading) return;
    if (!nextPath) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    window.location.assign(nextPath);
  }, [loginSuccess, clientUserLoading, nextPath]);

  if (signingIn) {
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
  }

  if (!shouldShowOneTap) return null;

  return (
    <GoogleOneTap
      setSigningIn={setSigningIn}
      setLoginSuccess={setLoginSuccess}
    />
  );
}
