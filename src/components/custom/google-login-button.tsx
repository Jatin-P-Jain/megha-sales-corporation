"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/useAuth";
import GoogleIcon from "@/components/custom/google-icon.svg";
import Image from "next/image";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
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
  const [signingIn, setSigningIn] = useState(false);
  const combinedClassName = `flex mx-auto rounded-4xl w-[80%] cursor-pointer w-full rounded-lg md:rounded-2xl py-3 md: py-5 shadow-sm text-sm md:text-base font-bold${
    className ? className : ""
  }`;
  return (
    <Button
      onClick={async () => {
        setSigningIn(true);
        try {
          await auth?.loginWithGoogle();
          if (onSuccess) {
            onSuccess();
            setSigningIn(false);
          } else {
            router.refresh();
            setSigningIn(false);
          }
        } catch (e) {
          setSigningIn(false);
          console.log({ e });
        }
      }}
      className={`${combinedClassName}`}
      variant={variant}
    >
      {signingIn ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Continuing with Google
        </>
      ) : (
        <>
          <Image
            src={GoogleIcon}
            alt=""
            className="relative h-8 max-h-8 w-8 max-w-8"
          />
          Continue with Google
        </>
      )}
    </Button>
  );
}
