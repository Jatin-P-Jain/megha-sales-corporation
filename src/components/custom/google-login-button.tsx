"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useAuthActions } from "@/context/useAuth";
import GoogleIcon from "@/components/custom/google-icon.svg";
import GoogleLoadingIcon from "@/assets/icons/google-loading.gif";

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
  isLogin?: boolean;
};

export default function GoogleLoginButton({
  variant = "outline",
  className,
  onSuccess,
  isLogin,
}: ButtonProps) {
  const { loginWithGoogle } = useAuthActions(); // ✅ actions-only subscription
  const [signingIn, setSigningIn] = useState(false);

  const combinedClassName = useMemo(
    () =>
      [
        "mx-auto flex w-full cursor-pointer rounded-lg py-3 text-sm font-bold shadow-sm md:rounded-2xl md:py-5 md:text-base",
        className ?? "",
      ].join(" "),
    [className],
  );

  const handleClick = useCallback(async () => {
    if (signingIn) return;
    setSigningIn(true);

    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (e) {
      console.log({ e });
    } finally {
      setSigningIn(false);
    }
  }, [loginWithGoogle, onSuccess, signingIn]);

  return (
    <Button
      onClick={handleClick}
      className={combinedClassName}
      variant={variant}
    >
      {signingIn ? (
        <>
          <Image
            src={GoogleLoadingIcon}
            alt=""
            className="relative"
            width={50}
            height={50}
          />
          {isLogin ? "Logging in with Google" : "Continue with Google"}
        </>
      ) : (
        <>
          <Image
            src={GoogleIcon}
            alt=""
            className="relative"
            width={30}
            height={30}
          />
          {isLogin ? "Login with Google" : "Continue with Google"}
        </>
      )}
    </Button>
  );
}
