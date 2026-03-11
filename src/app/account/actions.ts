"use server";
import { auth, fireStore } from "@/firebase/server";
import { createUserNotification } from "@/lib/firebase/createUserNotification";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { AccountStatus } from "@/types/userGate";
import { cookies } from "next/headers";

const accountStatusNotificationMap: Record<
  AccountStatus,
  { title: string; body: (rejectionReason?: string) => string }
> = {
  pending: {
    title: "Account Review Pending",
    body: () => "Your account is under review. We will update you soon.",
  },
  approved: {
    title: "Account Approved",
    body: () =>
      "Your account has been approved. You can now access all features.",
  },
  rejected: {
    title: "Account Rejected",
    body: (rejectionReason) =>
      rejectionReason?.trim()
        ? `Your account was rejected: ${rejectionReason.trim()}`
        : "Your account was rejected. Please contact support for details.",
  },
  suspended: {
    title: "Account Suspended",
    body: () =>
      "Your account access has been suspended. Please contact support.",
  },
  deactivated: {
    title: "Account Deactivated",
    body: () => "Your account has been deactivated. Please contact support.",
  },
};

export async function updateUserAccountStatus({
  userId,
  accountStatus,
  rejectionReason,
}: {
  userId: string;
  accountStatus: AccountStatus;
  rejectionReason?: string;
}) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prepare update data
    const updateData: {
      accountStatus: AccountStatus;
      rejectionReason?: string;
      updatedAt: Date;
    } = {
      accountStatus,
      updatedAt: new Date(),
    };

    // Add or remove rejection reason based on status
    if (accountStatus === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (accountStatus === "approved") {
      updateData.rejectionReason = ""; // Clear rejection reason on approval
    }

    const userRef = fireStore.collection("users").doc(userId);
    await userRef.update(updateData);

    const notificationConfig = accountStatusNotificationMap[accountStatus];
    await createUserNotification({
      uid: userId,
      type: "account",
      title: notificationConfig.title,
      body: notificationConfig.body(rejectionReason),
      url: "/account",
      clickAction: "view_account",
      status: accountStatus,
      source: "admin",
    });

    return { success: true, message: "User status updated successfully" };
  } catch (error) {
    console.error("Error updating user account status:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update user status"
    );
  }
}

export const updateUserFirebaseMethods = async (
  email?: string,
  photoUrl?: string
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    throw new Error("Unauthorized - No token found");
  }
  const decodedToken = await auth.verifyIdToken(token);
  const uid = decodedToken.uid;

  await fireStore
    .collection("users")
    .doc(uid)
    .update({
      firebaseAuth: decodedToken.firebase,
      email: email || decodedToken.email,
      photoUrl: photoUrl || null,
      updatedAt: new Date(),
    });

  return { success: true };
};
export const updateUserPhoto = async ({
  userId,
  photoUrl,
}: {
  userId: string;
  photoUrl: string;
}) => {
  if (!userId) return;
  try {
    const userRef = fireStore.collection("users").doc(userId);
    const imageUrl = imageUrlFormatter(photoUrl);
    await userRef.update({ photoUrl: imageUrl });
  } catch (error) {
    console.log("Error while updating the user -- ", { error });
  }
};
export const deleteUserCart = async ({ userId }: { userId: string }) => {
  if (!userId) return;
  try {
    const cartRef = fireStore.collection("carts").doc(userId);
    fireStore.recursiveDelete(cartRef);
  } catch (error) {
    console.log("Error while deleting cart for user -- ", { error });
  }
};
export const deleteUserData = async ({ userId }: { userId: string }) => {
  if (!userId) return;
  try {
    const userRef = fireStore.collection("users").doc(userId);
    await userRef.delete();
  } catch (error) {
    console.log("Error while deleting user data-- ", { error });
  }
};
