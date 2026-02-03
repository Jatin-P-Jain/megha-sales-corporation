import "server-only"
import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";
import { UserData } from "@/types/user";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";

export async function getUserFromDB() {
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
    const userDoc = await fireStore
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    const user = userDoc.data();
    const clientUser: UserData = mapDbUserToClientUser(user);
    return clientUser;
  } catch (e) {
    console.error({ e });
  }
}
