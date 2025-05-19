"use server";
import { auth, fireStore } from "@/firebase/server";
import { userProfileDataSchema } from "@/validation/profileSchema";
import { DecodedIdToken } from "firebase-admin/auth";
import { revalidatePath } from "next/cache";

export const updateUserProfile = async (
  data: {
    email: string;
    displayName: string;
    phone: string;
    role: string;
    firmName?: string;
    photo?: string;
  },
  verifiedToken: DecodedIdToken | null,
) => {
  if (!verifiedToken) {
    return;
  }

  const validation = userProfileDataSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const userData = {
    ...data,
    profileComplete: true,
    firebaseAuth: verifiedToken.firebase,
  };

  const uid = verifiedToken.uid;

  // Update Firestore profile
  await fireStore
    .collection("users")
    .doc(uid)
    .update({ ...userData, updatedAt: new Date() });

  // Update custom claims to mark profile as complete
  const userRecord = await auth.getUser(uid);
  const existingClaims = userRecord.customClaims ?? {};

  await auth.updateUser(uid, {
    displayName: data.displayName,
    email: data.email,
  });

  await auth.setCustomUserClaims(uid, {
    ...existingClaims,
    profileComplete: true,
  });

  // Invalidate cache
  revalidatePath(`/account/profile`);
  return {
    error: false,
    message: "Profile updated successfully",
    user: {
      uid,
      ...userData,
    },
  };
};
