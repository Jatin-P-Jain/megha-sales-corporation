"use server";

import { FieldValue } from "firebase-admin/firestore";
import { fireStore, auth } from "@/firebase/server";
import { UserData } from "@/types/user";
import { toast } from "sonner";
import { mapDbUserToClientUser } from "./mapDBUserToClient";
import { addAccountTimelineEvent } from "./addAccountTimelineEvent";

export const createUserIfNotExists = async (user: UserData) => {
  if (!user || !user.uid) return;

  try {
    const userRef = fireStore.collection("users").doc(user.uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      const now = new Date();
      const newUserData = {
        ...user,
        createdAt: now,
        updatedAt: now,
      };

      // Create users/{uid} and userGate/{uid} together in one batch so the
      // Cloud Function triggers always find both documents present, regardless
      // of which trigger fires first. This eliminates the race condition where
      // the client-side UserGateProvider hadn't yet created userGate when the
      // syncUsersDirectoryFromUsers function ran.
      const gateRef = fireStore.collection("userGate").doc(user.uid);
      const gateSnapshot = await gateRef.get();

      const batch = fireStore.batch();
      batch.set(userRef, newUserData);
      if (!gateSnapshot.exists) {
        // Check if the user has admin claims to set appropriate gate values
        const authUser = await auth.getUser(user.uid);
        const isAdmin = authUser.customClaims?.admin === true;

        batch.set(
          gateRef,
          isAdmin
            ? {
                profileComplete: true,
                accountStatus: "approved",
                rejectionReason: "",
                userRole: "admin",
                updatedAt: FieldValue.serverTimestamp(),
              }
            : {
                profileComplete: false,
                accountStatus: "pending",
                rejectionReason: "",
                userRole: "customer",
                updatedAt: FieldValue.serverTimestamp(),
              }
        );
      }
      await batch.commit();

      await addAccountTimelineEvent({
        uid: user.uid,
        type: "account_created",
        label: "Account created",
      });

      return { newUser: true, user: newUserData };
    }
    return {
      newUser: false,
      user: mapDbUserToClientUser(userSnapshot.data()) as UserData,
    };
  } catch (error) {
    console.error("Error in createUserIfNotExists:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to create user document"
    );
  }
};
