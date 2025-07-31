"use client";

import CommonLoginForm from "@/components/custom/login-form";
import { useAuth } from "@/context/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  console.log("LoginForm redirect:", redirect);

  useEffect(() => {
    if (auth.currentUser && auth.customClaims) {
      // Wait until logged in and claims loaded
      const profileComplete = auth.customClaims.profileComplete;
      if (profileComplete) {
        router.replace(redirect || "/");
      } else {
        router.replace("/account/profile");
      }
    }
  }, [auth.currentUser, auth.customClaims, redirect]);

  return (
    <CommonLoginForm
      onSuccess={() => {
        const profileComplete = auth?.customClaims?.profileComplete;
        if (profileComplete) {
          if (redirect) {
            router.replace(redirect);
          } else {
            router.replace("/");
          }
        } else {
          router.replace("/account/profile");
        }
      }}
    />
  );
}
