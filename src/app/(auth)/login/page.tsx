import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "./login-form";
import { InfoIcon } from "lucide-react";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ sessionExpired: number }>;
}) {
  const searchParamsValue = await searchParams;
  const sessionExpired = searchParamsValue.sessionExpired;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-center text-2xl">Login</CardTitle>
      </CardHeader>
      <CardContent>
        {sessionExpired && (
          <div className="mx-auto mb-4 flex w-fit items-center justify-center gap-2 rounded-lg bg-amber-100 p-2 text-center text-sm text-amber-700 italic">
            <InfoIcon className="size-8 md:size-4" />
            Your session has expired due to inactivity. Please log in again.
          </div>
        )}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
