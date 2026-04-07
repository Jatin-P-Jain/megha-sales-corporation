"use server";
import { auth, fireStore } from "@/firebase/server";
import { BusinessProfile } from "@/types/user";
import { cookies } from "next/headers";
import { addAccountTimelineEvent } from "@/lib/firebase/addAccountTimelineEvent";

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

    // Record timeline event based on what changed
    if (data.displayName) {
      await addAccountTimelineEvent({
        uid,
        type: "name_updated",
        label: "Name updated",
        detail: data.displayName,
      });
    }
    if (data.panNumber) {
      await addAccountTimelineEvent({
        uid,
        type: "pan_added",
        label: "PAN number added",
      });
    }
    if (data.gstNumber) {
      await addAccountTimelineEvent({
        uid,
        type: "gst_added",
        label: "GST number added",
        detail: data.gstNumber,
      });
    }
    if (data.phone) {
      await addAccountTimelineEvent({
        uid,
        type: "phone_linked",
        label: "Phone number linked",
        detail: data.phone,
      });
    }
    if (data.businessType && !data.gstNumber && !data.panNumber) {
      await addAccountTimelineEvent({
        uid,
        type: "profile_submitted",
        label: "Business profile submitted",
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update profile",
    );
  }
};
