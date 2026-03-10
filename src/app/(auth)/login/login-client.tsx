"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import LoginForm from "@/components/custom/login-form";
import { useAuthState } from "@/context/auth-context";
import { useUserGate } from "@/context/UserGateProvider";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export default function LoginClient({ redirect }: { redirect?: string }) {
  const { currentUser } = useAuthState();
  const { gate, gateLoading } = useUserGate();

  const [loginSuccess, setLoginSuccess] = useState(false);
  const redirectedRef = useRef(false);
  const safeRedirect = useMemo(() => getSafeRedirectPath(redirect), [redirect]);

  const nextPath = useMemo(() => {
    // If not logged in yet, don't decide.
    if (!currentUser) return null;

    // If gate not loaded yet, don't decide.
    if (gateLoading) return null;

    // If gate doc missing, treat as incomplete (or send to a safe default).
    if (!gate) return "/account/profile?from=login";

    if (!gate.profileComplete) return "/account/profile?from=login";
    return safeRedirect;
  }, [currentUser, gateLoading, gate, safeRedirect]);

  useEffect(() => {
    if (!loginSuccess) return;
    if (!nextPath) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;

    // Full navigation so server cookies/middleware take effect immediately
    window.location.assign(nextPath);
  }, [loginSuccess, nextPath]);

  return (
    <LoginForm
      onSuccess={() => {
        setLoginSuccess(true);
      }}
    />
  );
}
