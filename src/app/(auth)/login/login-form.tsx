"use client";

import CommonLoginForm from "@/components/custom/login-form";
import { useAuth } from "@/context/useAuth";

export default function LoginForm() {
  const auth = useAuth();
  return (
    <CommonLoginForm
      onSuccess={() => {
        const user = auth?.currentUser;
        if (user?.displayName && user?.phoneNumber && user?.email)
          window.location.assign("/");
        else window.location.assign("/account/complete-profile");
      }}
    />
  );
}
