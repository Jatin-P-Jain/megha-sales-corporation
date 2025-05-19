import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";

import { UserData, UserRole } from "@/types/user";

export function mapDbUserToClientUser(
  dbUser: FirebaseFirestore.DocumentData | undefined,
): UserData {
  return {
    uid: dbUser?.uid,
    role: (dbUser?.role as UserRole) || null,
    email: dbUser?.email || null,
    phone: dbUser?.phone || null,
    displayName: dbUser?.displayName || null,
    firmName: dbUser?.firmName || undefined,
    photoUrl: dbUser?.photoUrl || null,
    profileComplete: dbUser?.profileComplete ?? false,
    firebaseAuth: dbUser?.firebaseAuth || undefined,
  };
}

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
