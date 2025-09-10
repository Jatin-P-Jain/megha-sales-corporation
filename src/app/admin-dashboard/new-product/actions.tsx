"use server";

import { auth, fireStore } from "@/firebase/server";
import { slugifyPartNumber } from "@/lib/utils";
import { productDataSchema } from "@/validation/productSchema";

export const createProduct = async (
  data: {
    brandId: string;
    brandName: string;
    companyName: string;
    vehicleCompany: string;
    vehicleNames?: string[];
    partNumber: string;
    partName: string;
    price?: number;
    discount?: number;
    gst?: number;
    stock?: number;
    hasSizes?: boolean;
    samePriceForAllSizes?: boolean;
    sizes?: {
      size: string;
      price?: number;
      discount?: number;
      gst?: number;
    }[];
    description?: string;
    status: "draft" | "for-sale" | "discontinued" | "out-of-stock";
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

  const validation = productDataSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }
  const slug = slugifyPartNumber(data.partNumber);
  const docRef = fireStore.collection("products").doc(slug);

  try {
    await fireStore.runTransaction(async (txn) => {
      const existing = await txn.get(docRef);
      if (existing.exists) {
        throw new Error("Product already exists");
      }
      txn.set(docRef, {
        ...data,
        id: slug,
        brandId: data?.brandId,
        partNumber: data?.partNumber.toUpperCase(),
        available: data?.stock ? data?.stock > 0 : false,
        created: new Date(),
        updated: new Date(),
      });
    });
    return { productId: slug };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
