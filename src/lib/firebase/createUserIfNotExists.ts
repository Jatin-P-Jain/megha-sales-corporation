"use server";

import { fireStore } from "@/firebase/server";
import { UserData } from "@/types/user";
import { toast } from "sonner";
import { mapDbUserToClientUser } from "./mapDBUserToClient";

export const createUserIfNotExists = async (user: UserData) => {
  if (!user || !user.uid) return;

  try {
    const userRef = fireStore.collection("users").doc(user.uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      const newUserData = {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRef.set(newUserData);
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
