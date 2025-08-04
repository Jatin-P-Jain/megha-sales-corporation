"use client";
import GoogleLoginButton from "@/components/custom/google-login-button";

import CollapsibleLoginForm from "./collapsible-login-form";

import { MobileAuthWrapper } from "./mobile-auth/mobile-auth-wrapper";
import { Separator } from "../ui/separator";

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div>
      <MobileAuthWrapper onSuccess={onSuccess} />
      <div className="relative mx-8 my-4 flex flex-row items-center justify-center gap-4 overflow-hidden md:mx-36 md:gap-8">
        <Separator />
        <span className="text-muted-foreground text-[14px]">or</span>
        <Separator />
      </div>
      <GoogleLoginButton
        variant="outline"
        onSuccess={onSuccess}
        isLogin={true}
      />
      <div className="relative mx-8 my-4 flex flex-row items-center justify-center gap-4 overflow-hidden md:mx-36 md:gap-8">
        <Separator />
        <span className="text-muted-foreground text-[14px]">or</span>
        <Separator />
      </div>
      <CollapsibleLoginForm />
      {/* <div className="mt-4 flex items-center justify-center gap-2 text-xs md:text-sm">
        Don&apos;t have an account?
        <Link href="/register" className="text-cyan-900 underline">
          Register here.
        </Link>
      </div> */}
      <div className="text-muted-foreground mt-4 text-justify text-xs italic">
        If you don&apos;t have an account with us yet, please log in to begin.
        We will then kindly ask you to provide a few details to complete your
        registration. Thank you!
      </div>
      <div id="recaptcha-container" className="opacity-0" />
    </div>
  );
}
