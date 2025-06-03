"use client";

import CommonLoginForm from "@/components/custom/login-form";
import { useAuth } from "@/context/useAuth";

export default function LoginForm() {
  const auth = useAuth();
  return (
    <CommonLoginForm
      onSuccess={() => {
        const profileComplete = auth?.customClaims?.profileComplete;
        if (profileComplete) {
          window.location.assign("/");
        } else {
          window.location.assign("/account/profile");
        }
      }}
    />
  );
}
