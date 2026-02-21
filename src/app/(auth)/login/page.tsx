import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "./login-form";
import { InfoIcon, LogIn } from "lucide-react";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ sessionExpired: number; deepLink?: number }>;
}) {
  const searchParamsValue = await searchParams;
  const sessionExpired = searchParamsValue.sessionExpired;
  const deepLink = searchParamsValue.deepLink;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-xl md:text-2xl gap-2">
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
        <LoginForm />
      </CardContent>
    </Card>
  );
}
