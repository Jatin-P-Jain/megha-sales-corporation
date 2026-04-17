"use client";

import Image from "next/image";
import clsx from "clsx";
import { Link, Shield, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/custom/google-icon.svg";

export type FirebaseAuthDataLike = {
  sign_in_provider?: string;
  identities?: Record<string, unknown>;
};

type Props = {
  firebaseAuth: FirebaseAuthDataLike;

  // Actions
  onLinkGoogle?: () => void;
  onLinkPhone?: () => void;

  // UI/State
  linkingGoogle?: boolean;
  linkingPhone?: boolean;
};

const asStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
};

export default function FirebaseAuthMethods({
  firebaseAuth,
  onLinkGoogle,
  onLinkPhone,
  linkingGoogle,
  linkingPhone,
}: Props) {
  const identities = (firebaseAuth.identities ?? {}) as Record<string, unknown>;

  // In Firebase identities, keys are typically provider IDs like "google.com" and "phone". [web:88]
  const hasGoogle = asStringArray(identities["google.com"]).length > 0;
  const googleEmail = hasGoogle
    ? asStringArray(identities["email"])[0]
    : undefined;
  const hasPhone = asStringArray(identities["phone"]).length > 0;
  const phoneNumber = hasPhone
    ? asStringArray(identities["phone"])[0]
    : undefined;

  return (
    <div className="space-y-3 rounded-md bg-white">
      <div className="flex items-center gap-2 text-sm font-medium px-2">
        <Shield className="h-4 w-4" />
        Sign-in methods
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Phone */}
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-primary flex items-center gap-2 text-sm font-semibold">
              <Smartphone className="size-5" />
              Mobile OTP
            </div>

            {hasPhone && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <Link className="h-3 w-3" />
                Linked
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground mt-2 text-xs">
            {hasPhone ? (
              <span>
                You can login using an OTP sent to your phone number:{" "}
                <b className="inline-flex">
                  {`+91 - ${phoneNumber?.split("+91")[1]}`}
                </b>
                .
              </span>
            ) : (
              "Link your phone number to login using OTP."
            )}
          </div>

          {!hasPhone && onLinkPhone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              disabled={!!linkingPhone}
              onClick={onLinkPhone}
            >
              {linkingPhone ? "Linking..." : "Link phone (OTP)"}
            </Button>
          )}
        </div>

        {/* Google */}
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-primary flex items-center gap-2 text-sm font-semibold">
              <Image src={GoogleIcon} alt="" width={22} height={22} />
              Google account
            </div>

            {hasGoogle && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <Link className="h-3 w-3" />
                Linked
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground mt-2 text-xs">
            {hasGoogle ? (
              <span className="">
                You can login using your Google account{" "}
                <b className="inline-flex">{googleEmail}</b>
              </span>
            ) : (
              "Link a Google account to login with Google in the future."
            )}
          </div>

          {!hasGoogle && onLinkGoogle && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={clsx("w-full gap-2")}
              disabled={!!linkingGoogle}
              onClick={onLinkGoogle}
            >
              <Image src={GoogleIcon} alt="" width={18} height={18} />
              {linkingGoogle ? "Linking..." : "Link Google account"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
