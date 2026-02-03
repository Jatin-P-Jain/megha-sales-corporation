"use client";

import CommonLoginForm from "@/components/custom/login-form";
import { useAuth } from "@/context/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginForm() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || undefined;
  const router = useRouter();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // ✅ Wait for clientUser to be loaded after login before redirecting
  useEffect(() => {
    if (loginSuccess && !auth.clientUserLoading && auth.clientUser) {
      const profileComplete = auth.clientUser.profileComplete;

      console.log(
        "🔍 Login redirect check - Profile complete:",
        profileComplete,
      );

      if (profileComplete) {
        if (redirect) {
          router.replace(redirect);
        } else {
          router.replace("/");
        }
      } else {
        router.replace("/account/profile");
      }

      // Reset the flag
      setLoginSuccess(false);
    }
  }, [loginSuccess, auth.clientUserLoading, auth.clientUser, redirect, router]);

  return (
    <CommonLoginForm
      onSuccess={() => {
        console.log("✅ Login successful, waiting for clientUser to load...");
        // Don't redirect immediately, wait for clientUser to load
        setLoginSuccess(true);
      }}
    />
  );
}
