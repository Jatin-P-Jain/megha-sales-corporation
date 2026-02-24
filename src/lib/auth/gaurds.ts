import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, fireStore } from "@/firebase/server";
import { mapDbUserToClientUser } from "../firebase/mapDBUserToClient";

export async function getVerifiedTokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) redirect("/login");

  // Admin SDK verifies signature + returns uid + custom claims (e.g. admin)
  return auth.verifyIdToken(token);
}

export async function requireProfileCompleteOrRedirect(redirectTo: string) {
  const decoded = await getVerifiedTokenOrRedirect();

  const snap = await fireStore.collection("users").doc(decoded.uid).get();
  const user = snap.exists ? mapDbUserToClientUser(snap.data()) : null;
  console.log({ user });

  if (!user?.profileComplete) {
    redirect(`/account/profile?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return { decoded, user };
}
