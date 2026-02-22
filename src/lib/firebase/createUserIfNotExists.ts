"use server";

import { fireStore } from "@/firebase/server";
import { UserData } from "@/types/user";

export const createUserIfNotExists = async (user: UserData) => {
  if (!user || !user.uuid) return;

  const userRef = fireStore.collection("users").doc(user.uuid);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const adminPhoneNumbers = process.env.ADMIN_PHONES?.split(",") || [];
    const isAdmin =
      (user.email && adminEmails.includes(user.email)) ||
      (user.phone && adminPhoneNumbers.includes(user.phone));
    const newUserData = {
      ...user,
      profileComplete: false,
      userType: isAdmin ? "admin" : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await userRef.set(newUserData);
  }
};
