"use server";
import { auth, fireStore } from "@/firebase/server";
import { notifyUser } from "@/lib/firebase/notifyUser";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { AccountStatus, UserRole } from "@/types/userGate";
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

export async function updateUserRole({
  targetUserId,
  userRole,
}: {
  targetUserId: string;
  userRole: UserRole;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) throw new Error("Unauthorized");

  const decodedToken = await auth.verifyIdToken(token);

  // Only full admins (userRole === "admin" with no sub-role, i.e. env admins) can assign roles
  const callerUserRole = decodedToken.userRole as string | undefined;
  const isFullAdmin =
    decodedToken.admin && (!callerUserRole || callerUserRole === "admin");
  if (!isFullAdmin)
    throw new Error("Unauthorized: Only admins can assign roles");

  const isStaff = userRole !== "customer";

  // Build Firestore update — userRole is the single source of truth
  const updateData: Record<string, unknown> = {
    userRole,
    updatedAt: new Date(),
  };

  if (isStaff) {
    // All staff get auto-approved so they can log into the dashboard
    updateData.accountStatus = "approved";
    updateData.profileComplete = true;
  }

  const batch = fireStore.batch();
  batch.set(fireStore.collection("users").doc(targetUserId), updateData, {
    merge: true,
  });
  batch.set(fireStore.collection("userGate").doc(targetUserId), updateData, {
    merge: true,
  });
  await batch.commit();

  // Sync Firebase Auth custom claims
  const targetRecord = await auth.getUser(targetUserId);
  const existingClaims = (targetRecord.customClaims ?? {}) as Record<
    string,
    unknown
  >;

  if (isStaff) {
    await auth.setCustomUserClaims(targetUserId, {
      ...existingClaims,
      admin: true,
      userRole,
    });
  } else {
    // Reverting to customer — remove admin claim unless they're an env admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") ?? [];
    const adminPhones = process.env.ADMIN_PHONES?.split(",") ?? [];
    const isEnvAdmin =
      (targetRecord.email && adminEmails.includes(targetRecord.email)) ||
      (targetRecord.phoneNumber &&
        adminPhones.includes(targetRecord.phoneNumber));

    const { userRole: _r, ...restClaims } = existingClaims;
    if (isEnvAdmin) {
      await auth.setCustomUserClaims(targetUserId, {
        ...restClaims,
        admin: true,
      });
    } else {
      const { admin: _a, ...noClaims } = restClaims;
      await auth.setCustomUserClaims(targetUserId, noClaims);
    }
  }

  await addAccountTimelineEvent({
    uid: targetUserId,
    type: "role_assigned",
    label: "Role updated",
    detail: userRole,
  });

  await notifyUser({
    uid: targetUserId,
    type: "account",
    title: "🛡️ Role Updated",
    body: `Your account role has been updated to ${userRole}.`,
    url: "/account",
    clickAction: "view_account",
    source: "admin",
  });

  return { success: true };
}
