"use client";
import { useRouter } from "next/navigation";

import CommonLoginForm from "@/components/custom/login-form";
import { NameForm } from "@/components/custom/name-form";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleLoginButton from "@/components/custom/google-login-button";

export default function GetUserDetails() {
  const auth = useAuth();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-center text-2xl">
          Provide Your Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <NameForm
          user={auth?.currentUser ?? null}
          onSuccess={() => router.refresh()}
        />
        {/* <span className="w-full flex justify-center text-zinc-500 text-[14px] my-4">
          or
        </span>
        <GoogleLoginButton
          variant={"outline"}
          onSuccess={() => router.refresh()}
          className="w-full rounded-2xl py-6 shadow-sm text-md font-bold"
          buttonText="Get My Details from Google"
        /> */}
      </CardContent>
    </Card>
  );
}
