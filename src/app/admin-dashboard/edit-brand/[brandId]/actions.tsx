"use server";

import { auth, fireStore } from "@/firebase/server";
import { Brand } from "@/types/brand";
import { brandDataSchema } from "@/validation/brandSchema";
import { revalidatePath } from "next/cache";

export const updateBrand = async (data: Brand, authToken: string) => {
  const {
    id: id,
    totalProducts: _totalProducts,
    brandLogo: _brandLogo,
    brandMedia: _brandMedia,
    ...brandData
  } = data;
  const verifiedToken = await auth.verifyIdToken(authToken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  const validation = brandDataSchema.safeParse(brandData);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  await fireStore
    .collection("brands")
    .doc(id)
    .update({ ...brandData, updated: new Date() });

  revalidatePath(`/brands/${id}`);
};
