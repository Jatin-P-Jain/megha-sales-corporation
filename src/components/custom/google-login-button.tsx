"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth";
import GoogleIcon from "@/components/custom/google-icon.svg";
import Image from "next/image";
import { on } from "events";
type ButtonProps = {
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  className?: string;
  onSuccess?: () => void;
};

export default function GoogleLoginButton({
  variant,
  className,
  onSuccess,
}: ButtonProps) {
  const auth = useAuth();
  const router = useRouter();
  const combinedClassName = `flex mx-auto rounded-4xl w-[80%] max-w-sm cursor-pointer ${
    className ? className : ""
  }`;
  return (
    <Button
      onClick={async () => {
        try {
          await auth?.loginWithGoogle();
          onSuccess ? onSuccess() : router.refresh();
        } catch (e) {}
      }}
      className={`${combinedClassName}`}
      variant={variant}
    >
      <Image
        src={GoogleIcon}
        alt=""
        className="relative w-7 h-7 max-w-7 max-h-7"
      />
      Continue with Google
    </Button>
  );
}
