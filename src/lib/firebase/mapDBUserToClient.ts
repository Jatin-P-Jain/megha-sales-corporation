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
    gstNumber: dbUser?.gstNumber || undefined,
    photoUrl: dbUser?.photoUrl || null,
    businessProfile: dbUser?.businessProfile || null,
    profileComplete: dbUser?.profileComplete ?? false,
    accountStatus: dbUser?.accountStatus ?? false,
    firebaseAuth: dbUser?.firebaseAuth || undefined,
  };
}
