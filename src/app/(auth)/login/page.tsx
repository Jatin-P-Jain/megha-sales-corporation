// app/login/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, LogIn } from "lucide-react";
import LoginClient from "./login-client";

type SP = {
  sessionExpired?: string | string[];
  deepLink?: string | string[];
  redirect?: string | string[];
};

function toBool(v: SP[keyof SP]) {
  if (!v) return false;
  const s = Array.isArray(v) ? v[0] : v;
  return s === "1" || s === "true" || s === "yes";
}

function toStr(v: SP[keyof SP]) {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const sessionExpired = toBool(sp.sessionExpired);
  const deepLink = toBool(sp.deepLink);
  const redirect = toStr(sp.redirect);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
          Login <LogIn className="font-bold" />
        </CardTitle>
      </CardHeader>

      <CardContent>
        {sessionExpired && (
          <div className="mx-auto mb-4 flex w-fit items-center justify-center gap-2 rounded-lg bg-amber-100 p-2 text-center text-xs text-amber-700 italic">
            <InfoIcon className="size-4" />
            Your session has expired due to inactivity. Please log in again.
          </div>
        )}

        {deepLink && (
          <div className="mx-auto mb-4 flex w-fit items-center justify-center gap-2 rounded-lg bg-amber-100 p-2 text-center text-xs text-amber-700 italic">
            <InfoIcon className="size-4" />
            Please log in to continue to the page.
          </div>
        )}

        <LoginClient redirect={redirect} />
        <div id="recaptcha-container" className="opacity-0" />
      </CardContent>
    </Card>
  );
}
