"use client";

import CommonLoginForm from "@/components/custom/login-form";

export default function LoginForm() {
  return (
    <CommonLoginForm
      onSuccess={() => {
        window.location.assign("/");
      }}
    />
  );
}
