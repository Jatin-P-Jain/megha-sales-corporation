"use server";
import { BusinessProfile } from "@/data/businessProfile";
import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";

export const updateUserProfile = async (data: {
  email?: string;
  displayName?: string;
  phone?: string;
  businessType?: string;
  businessIdType?: "pan" | "gst";
  gstNumber?: string;
  panNumber?: string;
  firmName?: string;
  businessProfile?: BusinessProfile | null;
  photoUrl?: string;
}) => {
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
      firebaseAuth: decodedToken.firebase,
    };

    await fireStore
      .collection("users")
      .doc(uid)
      .update({ ...userData, updatedAt: new Date() });

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update profile",
    );
  }
};
