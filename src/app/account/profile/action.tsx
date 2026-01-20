"use server";
import { BusinessProfile } from "@/data/businessProfile";
import { auth, fireStore } from "@/firebase/server";
import { userProfileDataSchema } from "@/validation/profileSchema";
import { DecodedIdToken } from "firebase-admin/auth";

export const updateUserProfile = async (
  data: {
    email: string;
    displayName: string;
    phone: string;
    role?: string;
    gstNumber?: string;
    businessProfile?: BusinessProfile | null;
    photo?: string;
  },
  verifiedToken: DecodedIdToken | null,
) => {
  // 1) Authentication check
  if (!verifiedToken) {
    throw new Error("You must be signed in to update your profile.");
  }

  // 2) Validation check
  const validation = userProfileDataSchema.safeParse(data);
  if (!validation.success) {
    // pick the first issue for simplicity
    throw new Error(validation.error.issues[0].message);
  }

  const uid = verifiedToken.uid;
  const userData = {
    ...data,
    profileComplete: true,
    firebaseAuth: verifiedToken.firebase,
  };

  await auth.updateUser(uid, {
    displayName: data.displayName,
    email: data.email,
  });

  await fireStore
    .collection("users")
    .doc(uid)
    .update({ ...userData, updatedAt: new Date() });

  const userRecord = await auth.getUser(uid);
  const existingClaims = userRecord.customClaims ?? {};
  await auth.setCustomUserClaims(uid, {
    ...existingClaims,
    role: data.role,
    profileComplete: true,
  });
  console.log("update user claims complete profile");

  // 6) Return the updated user for your client
  return { uid, ...userData };
};
