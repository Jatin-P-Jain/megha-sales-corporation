"use server";

import { auth, fireStore } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

export const addFavourite = async (propertyId: string, authToken: string) => {
  const verifiedToken = await auth.verifyIdToken(authToken);
  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
  try {
    await fireStore
      .collection("favourites")
      .doc(verifiedToken.uid)
      .set({ [propertyId]: true }, { merge: true });
  } catch (e) {
    console.log("e -- ", e);
  }
};

export const removeFavourite = async (
  propertyId: string,
  authToken: string
) => {
  const verifiedToken = await auth.verifyIdToken(authToken);
  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
  try {
    await fireStore
      .collection("favourites")
      .doc(verifiedToken.uid)
      .update({ [propertyId]: FieldValue.delete() });
  } catch (e) {
    console.log("e -- ", e);
  }
};
