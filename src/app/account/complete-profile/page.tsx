import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "./profile-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DecodedIdToken } from "firebase-admin/auth";
import { auth } from "@/firebase/server";

export default async function Login() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    redirect("/");
  }
  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await auth.verifyIdToken(token);
  } catch (e) {
    console.log({ e });
    redirect("/");
  }
  const user = await auth.getUser(decodedToken.uid);
  if (!user) {
    console.log("no user found");

    redirect("/");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-center text-2xl">
          Complete Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm />
      </CardContent>
    </Card>
  );
}
