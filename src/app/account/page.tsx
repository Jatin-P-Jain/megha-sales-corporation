import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/firebase/server";
import { DecodedIdToken } from "firebase-admin/auth";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UpdatePasswordForm from "./update-password";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { removeToken } from "@/context/actions";
import { toast } from "sonner";
import DeleteAccountButton from "./delete-account-button";

export default async function Account() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    redirect("/");
  }
  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await auth.verifyIdToken(token);
  } catch (e) {
    redirect("/");
  }
  const user = await auth.getUser(decodedToken.uid);
  if (!user) {
    redirect("/");
  }
  const isPasswordProvider = user.providerData.find(
    (provider) => provider.providerId === "password"
  );
  const isGoogleProvider = user.providerData.find(
    (provider) => provider.providerId === "google.com"
  );
  const isAdmin = !!user.customClaims?.admin;

  return (
    <div>
      <Card className="w-full max-w-screen-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-sky-950 font-semibold mb-4">
            My Account
          </CardTitle>
          <Label className="text-md text-normal">Email</Label>
          <div className="text-sky-950 font-medium">{decodedToken?.email}</div>
        </CardHeader>

        {isPasswordProvider && (
          <>
            <Separator />
            <CardContent>
              <div className="text-md mb-5 font-semibold text-sky-950">
                Update Your Password
              </div>
              <UpdatePasswordForm />
            </CardContent>
          </>
        )}
        {!isAdmin && (
          <>
            <Separator />
            <CardFooter className="flex flex-col gap-1">
              <div className="flex text-xl text-red-600 font-bold  w-full">
                Delete Account
              </div>
              <span className="text-zinc-700 text-sm italic w-full flex">
                You will be deleting your account permanently. Are you sure?
              </span>
              <DeleteAccountButton isGoogleProvider />
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
