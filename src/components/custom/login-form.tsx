"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginUserMobileSchema } from "@/validation/loginUser";

import Link from "next/link";
import { useAuth } from "@/context/useAuth";
import GoogleLoginButton from "@/components/custom/google-login-button";
import { useState } from "react";
import { ConfirmationResult } from "firebase/auth";

import CollapsibleLoginForm from "./collapsible-login-form";

import { MobileAuthWrapper } from "./mobile-auth/mobile-auth-wrapper";

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div>
      <MobileAuthWrapper onSuccess={onSuccess} />
      <span className="my-4 flex w-full justify-center text-[14px] text-zinc-500">
        or
      </span>
      <GoogleLoginButton variant="outline" onSuccess={onSuccess} />
      <span className="my-4 flex w-full justify-center text-[14px] text-zinc-500">
        or
      </span>
      <CollapsibleLoginForm />
      <div className="mt-4 flex items-center justify-center gap-2 text-xs md:text-sm">
        Don&apos;t have an account?
        <Link href="/register" className="text-cyan-900 underline">
          Register here.
        </Link>
      </div>
      <div id="recaptcha-container" className="opacity-0" />
    </div>
  );
}
