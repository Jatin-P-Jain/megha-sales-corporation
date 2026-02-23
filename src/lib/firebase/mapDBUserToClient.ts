import { UserData, UserType } from "@/types/user";

export function mapDbUserToClientUser(
  dbUser: FirebaseFirestore.DocumentData | undefined
): UserData {
  return {
    uuid: dbUser?.uuid,
    userId: dbUser?.userId,
    userType: (dbUser?.userType as UserType) || null,
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
    profileComplete: dbUser?.profileComplete ?? false,
    accountStatus: dbUser?.accountStatus ?? false,
    firebaseAuth: dbUser?.firebaseAuth || undefined,
  };
}
