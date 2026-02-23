// wherever your LoginForm component lives
"use client";

import LoginForm from "@/components/custom/login-form";
import { useAuthState } from "@/context/useAuth";
import { useEffect, useMemo, useRef, useState } from "react";

export default function LoginClient({ redirect }: { redirect?: string }) {
  const { clientUser, clientUserLoading } = useAuthState(); // ✅ lighter [web:512]

  const [loginSuccess, setLoginSuccess] = useState(false);
  const redirectedRef = useRef(false);

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

    // Use full navigation if middleware/cookies must be applied immediately
    window.location.assign(nextPath);
  }, [loginSuccess, clientUserLoading, nextPath]);

  return (
    <LoginForm
      onSuccess={() => {
        setLoginSuccess(true);
      }}
    />
  );
}
