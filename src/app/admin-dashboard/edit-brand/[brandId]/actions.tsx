"use server";

import { auth, fireStore, storage } from "@/firebase/server";
import { Brand } from "@/types/brand";
import { brandDataSchema } from "@/validation/brandSchema";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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
export const deleteBrand = async (brandId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    return;
  }
  const verifiedToken = await auth.verifyIdToken(token);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
  const folderPath = `brands/${brandId}`;
  const bucket = storage.bucket();

  const [files] = await bucket.getFiles({ prefix: folderPath });

  await Promise.all(files.map((file) => file.delete()));
  await fireStore.collection("brands").doc(brandId).delete();

  revalidatePath(`/brands`);
};
