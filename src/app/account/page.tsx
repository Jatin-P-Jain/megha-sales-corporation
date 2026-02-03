import { auth } from "@/firebase/server";
import { DecodedIdToken } from "firebase-admin/auth";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AccountPage from "./account-page";

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
    console.log({ e });
    redirect("/");
  }
  const user = await auth.getUser(decodedToken.uid);
  if (!user) {
    redirect("/");
  }
  const isPasswordProvider = user.providerData.find(
    (provider) => provider.providerId === "password",
  );


  return (
    <AccountPage
      isPasswordProvider={isPasswordProvider ? true : false}
    />
  );
}
