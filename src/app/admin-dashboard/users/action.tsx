"use server";

import { auth, fireStore } from "@/firebase/server";
import { BrandStatus } from "@/types/brandStatus";
import { revalidatePath } from "next/cache";

export const updateStatus = async (
  { brandId, newBrandStatus }: { brandId: string; newBrandStatus: BrandStatus },
  authToken: string
) => {
  const verifiedToken = await auth.verifyIdToken(authToken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  await fireStore
    .collection("brands")
    .doc(brandId)
    .update({ status: newBrandStatus, updated: new Date() });

  revalidatePath(`/brands/${brandId}`);
};
