"use server";
import { auth, fireStore } from "@/firebase/server";
import { notifyUser } from "@/lib/firebase/notifyUser";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { AccountStatus } from "@/types/userGate";
import { cookies } from "next/headers";
import { addAccountTimelineEvent } from "@/lib/firebase/addAccountTimelineEvent";

const accountStatusNotificationMap: Record<
  AccountStatus,
  { title: string; body: (rejectionReason?: string) => string }
> = {
  pending: {
    title: "⏳ Account Review Pending",
    body: () => "Your account is under review. We will update you soon.",
  },
  approved: {
    title: "✅ Account Approved",
    body: () =>
      "Your account has been approved. You can now access all features.",
  },
  rejected: {
    title: "❌ Account Rejected",
    body: (rejectionReason) =>
      rejectionReason?.trim()
        ? `Your account was rejected: ${rejectionReason.trim()}`
        : "Your account was rejected. Please contact support for details.",
  },
  suspended: {
    title: "⛔ Account Suspended",
    body: () =>
      "Your account access has been suspended. Please contact support.",
  },
  deactivated: {
    title: "🚫 Account Deactivated",
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

    // Keep users and userGate in sync because gate drives access/status UI.
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
    const userGateRef = fireStore.collection("userGate").doc(userId);
    const batch = fireStore.batch();

    batch.set(userRef, updateData, { merge: true });
    batch.set(userGateRef, updateData, { merge: true });
    await batch.commit();

    const notificationConfig = accountStatusNotificationMap[accountStatus];
    await notifyUser({
      uid: userId,
      type: "account",
      title: notificationConfig.title,
      body: notificationConfig.body(rejectionReason),
      url: "/account",
      clickAction: "view_account",
      status: accountStatus,
      source: "admin",
    });

    const statusEventMap: Record<
      AccountStatus,
      {
        type: Parameters<typeof addAccountTimelineEvent>[0]["type"];
        label: string;
      }
    > = {
      pending: {
        type: "account_created",
        label: "Account submitted for review",
      },
      approved: { type: "account_approved", label: "Account approved" },
      rejected: { type: "account_rejected", label: "Account rejected" },
      suspended: { type: "account_suspended", label: "Account suspended" },
      deactivated: {
        type: "account_deactivated",
        label: "Account deactivated",
      },
    };
    const ev = statusEventMap[accountStatus];
    await addAccountTimelineEvent({
      uid: userId,
      type: ev.type,
      label: ev.label,
      detail:
        accountStatus === "rejected" && rejectionReason
          ? rejectionReason
          : undefined,
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

  await addAccountTimelineEvent({
    uid,
    type: "google_linked",
    label: "Google account linked",
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
    await addAccountTimelineEvent({
      uid: userId,
      type: "photo_updated",
      label: "Profile picture updated",
    });
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
