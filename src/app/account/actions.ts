"use server";

import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";

export default async function deleteUserFavourites() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    return;
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken) {
      return;
    }
    await fireStore.collection("favourites").doc(decodedToken.uid).delete();
  } catch (e) {
    console.error({ e });
  }
}
