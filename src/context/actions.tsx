"use server";

import { auth } from "@/firebase/server";
import { cookies } from "next/headers";

export const removeToken = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("firebaseAuthToken");
  cookieStore.delete("firebaseAuthRefreshToken");
};

export const setToken = async (token: string, refreshToken: string) => {
  try {
    const verifiedToken = await auth.verifyIdToken(token);
    if (!verifiedToken) {
      return;
    }
    const userRecord = await auth.getUser(verifiedToken.uid);
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const adminPhoneNumbers = process.env.ADMIN_PHONES?.split(",") || [];
    if (
      userRecord.email &&
      adminEmails.includes(userRecord.email) &&
      !userRecord.customClaims?.admin
    ) {
      auth.setCustomUserClaims(userRecord.uid, {
        admin: true,
      });
    }
    if (
      userRecord.phoneNumber &&
      adminPhoneNumbers.includes(userRecord.phoneNumber) &&
      !userRecord.customClaims?.admin
    ) {
      auth.setCustomUserClaims(userRecord.uid, {
        admin: true,
      });
    }

    const cookieStore = await cookies();
    cookieStore.set("firebaseAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
    });
    cookieStore.set("firebaseAuthRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
    });
  } catch (e) {
    console.log(e);
  }
};
