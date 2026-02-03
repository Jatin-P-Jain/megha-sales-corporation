"use client";

import CommonLoginForm from "@/components/custom/login-form";
import { useAuth } from "@/context/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginForm() {
  const auth = useAuth();
  const profileComplete = auth.clientUser?.profileComplete;
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || undefined;
  const router = useRouter();


  return (  
    <CommonLoginForm
      onSuccess={() => {
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
