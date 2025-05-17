"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/useAuth";
import GoogleIcon from "@/components/custom/google-icon.svg";
import Image from "next/image";
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
  buttonText?: string;
};

export default function GoogleLoginButton({
  variant,
  className,
  onSuccess,
  buttonText = "Continue with Google",
}: ButtonProps) {
  const auth = useAuth();
  const router = useRouter();
  const combinedClassName = `flex mx-auto rounded-4xl w-[80%] cursor-pointer w-full rounded-lg md:rounded-2xl py-3 md: py-5 shadow-sm text-sm md:text-base font-bold${
    className ? className : ""
  }`;
  return (
    <Button
      onClick={async () => {
        try {
          await auth?.loginWithGoogle();
          if (onSuccess) {
            onSuccess();
          } else {
            router.refresh();
          }
        } catch (e) {
          console.log({ e });
        }
      }}
      className={`${combinedClassName}`}
      variant={variant}
    >
      <Image
        src={GoogleIcon}
        alt=""
        className="relative h-8 max-h-8 w-8 max-w-8"
      />
      {buttonText}
    </Button>
  );
}
