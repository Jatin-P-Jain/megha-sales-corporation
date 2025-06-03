"use client";

import CommonLoginForm from "@/components/custom/login-form";
import { useAuth } from "@/context/useAuth";

export default function LoginForm() {
  const auth = useAuth();
  return (
    <CommonLoginForm
      onSuccess={() => {
        const profileComplete = auth?.customClaims?.profileComplete;
        const isAdmin = auth?.customClaims?.admin;
        console.log(auth?.customClaims);

        console.log({ profileComplete, isAdmin });

        if (profileComplete) {
          if (isAdmin) {
            window.location.assign("/admin-dashboard");
          }
        } else {
          window.location.assign("/account/profile");
        }
      }}
    />
  );
}
