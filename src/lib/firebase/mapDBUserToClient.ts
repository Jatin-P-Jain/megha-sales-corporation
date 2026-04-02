import { UserData } from "@/types/user";

export function mapDbUserToClientUser(
  dbUser: FirebaseFirestore.DocumentData | undefined
): UserData {
  return {
    uid: dbUser?.uid,
    userId: dbUser?.userId,
    email: dbUser?.email || null,
    phone: dbUser?.phone || null,
    displayName: dbUser?.displayName || null,
    businessType: dbUser?.businessType || null,
    businessIdType: dbUser?.businessIdType || null,
    panNumber: dbUser?.panNumber || undefined,
    firmName: dbUser?.firmName || undefined,
    gstNumber: dbUser?.gstNumber || undefined,
    photoUrl: dbUser?.photoUrl || null,
    businessProfile: dbUser?.businessProfile || null,
    firebaseAuth: dbUser?.firebaseAuth || undefined,
  };
}
