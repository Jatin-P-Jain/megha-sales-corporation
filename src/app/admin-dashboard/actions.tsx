"use server";
import { auth, fireStore } from "@/firebase/server";
import { z } from "zod";

export const savePropertyImages = async (
  {
    images,
    propertyId,
  }: {
    images: string[];
    propertyId: string;
  },
  authtoken: string
) => {
  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
  const schema = z.object({
    propertyId: z.string(),
    images: z.array(z.string()),
  });

  const validation = schema.safeParse({ images, propertyId });
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  await fireStore.collection("properties").doc(propertyId).update({ images });
};
