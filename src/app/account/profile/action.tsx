"use server";
import { BusinessProfile } from "@/data/businessProfile";
import { auth, fireStore } from "@/firebase/server";
import { UserType } from "@/types/user";
import { cookies } from "next/headers";

export const updateUserProfile = async (
  data: {
    email?: string;
    displayName?: string;
    phone?: string;
    userType?: UserType;
    businessType?: string;
    businessIdType?: "pan" | "gst";
    gstNumber?: string;
    panNumber?: string;
    firmName?: string;
    businessProfile?: BusinessProfile | null;
    photoUrl?: string;
  },
  { profileComplete }: { profileComplete: boolean },
) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      throw new Error("Unauthorized - No token found");
    }

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userData = {
      ...data,
      profileComplete,
      accountStatus: "pending",
      firebaseAuth: decodedToken.firebase,
    };

    await fireStore
      .collection("users")
      .doc(uid)
      .update({ ...userData, updatedAt: new Date() });

    const userRecord = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
      ...(userRecord.customClaims || {}),
      profileComplete,
    });

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update profile",
    );
  }
};
