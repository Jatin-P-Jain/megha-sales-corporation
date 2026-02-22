"use server";
import { auth, fireStore } from "@/firebase/server";
import { BrandMedia } from "@/types/brand";
import { z } from "zod";

export const saveBrandMedia = async (
  {
    brandLogo,
    brandMedia,
    brandId,
  }: {
    brandLogo: string;
    brandMedia: BrandMedia[];
    brandId: string;
  },
  authtoken: string,
) => {
  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
  const schema = z.object({
    brandId: z.string(),
    brandMedia: z.array(
      z.object({ fileName: z.string(), fileUrl: z.string() }),
    ),
    brandLogo: z.string(),
  });

  const validation = schema.safeParse({ brandMedia, brandId, brandLogo });
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  await fireStore
    .collection("brands")
    .doc(brandId)
    .update({ brandMedia, brandLogo });
};
export const updateBrandProcuctCount = async (
  {
    brandId,
    totalProducts,
  }: {
    brandId: string;
    totalProducts: number;
  },
  authtoken: string,
) => {
  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  await fireStore.collection("brands").doc(brandId).update({ totalProducts });
};