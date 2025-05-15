"use server";

import { auth, fireStore, storage } from "@/firebase/server";
import { Product } from "@/types/product";
import { productDataSchema } from "@/validation/productSchema";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const updateProduct = async (data: Product, authToken: string) => {
  const { id: id, image: _image, ...productData } = data;
  const verifiedToken = await auth.verifyIdToken(authToken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  const validation = productDataSchema.safeParse(productData);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  await fireStore
    .collection("products")
    .doc(id)
    .update({ ...productData, updated: new Date() });

  revalidatePath(`/products/${id}`);
};
export const deleteProduct = async (productId: string,) => {
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
  const folderPath = `products/${productId}`;
  const bucket = storage.bucket();

  const [files] = await bucket.getFiles({ prefix: folderPath });

  await Promise.all(files.map((file) => file.delete()));
  await fireStore.collection("products").doc(productId).delete();


  revalidatePath(`/products-list`);
};
