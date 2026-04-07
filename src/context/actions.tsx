"use server";

import { auth } from "@/firebase/server";
import { cookies } from "next/headers";

export const removeToken = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("firebaseAuthToken");
  cookieStore.delete("firebaseAuthRefreshToken");
};

export const setToken = async (
  token: string,
  refreshToken: string,
): Promise<{ claimsUpdated: boolean }> => {
  try {
    const verifiedToken = await auth.verifyIdToken(token);
    if (!verifiedToken) return { claimsUpdated: false };

    const userRecord = await auth.getUser(verifiedToken.uid);

    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const adminPhoneNumbers = process.env.ADMIN_PHONES?.split(",") || [];

    // Start with current claims (or empty object)
    const existingClaims = userRecord.customClaims ?? {};
    const newClaims: Record<string, boolean> = { ...existingClaims };

    // Admin logic
    if (userRecord.email && adminEmails.includes(userRecord.email)) {
      newClaims.admin = true;
    }
    if (
      userRecord.phoneNumber &&
      adminPhoneNumbers.includes(userRecord.phoneNumber)
    ) {
      newClaims.admin = true;
    }

    // Only update claims if they actually changed
    const claimsChanged =
      JSON.stringify(existingClaims) !== JSON.stringify(newClaims);
    if (claimsChanged) {
      await auth.setCustomUserClaims(userRecord.uid, newClaims);
    }

    const cookieStore = await cookies();
    cookieStore.set("firebaseAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set("firebaseAuthRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return { claimsUpdated: claimsChanged };
  } catch (e) {
    console.error("Error setting token/claims:", e);
    return { claimsUpdated: false };
  }
};
