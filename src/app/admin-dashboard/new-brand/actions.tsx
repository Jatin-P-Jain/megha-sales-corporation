"use server";

import { auth, fireStore } from "@/firebase/server";
import { slugify } from "@/lib/utils";
import { brandDataSchema } from "@/validation/brandSchema";

export const createBrand = async (
  data: {
    brandName: string;
    companies: string[];
    vehicleCompanies: string[];
    vehicleNames?: string[];
    description?: string;
    status: "draft" | "live" | "discontinued";
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

  const validation = brandDataSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const slug = slugify(data.brandName);
  const docRef = fireStore.collection("brands").doc(slug);
  try {
    await fireStore.runTransaction(async (txn) => {
      const existing = await txn.get(docRef);
      if (existing.exists) {
        throw new Error("Brand already exists");
      }
      txn.set(docRef, {
        ...data,
        id: slug,
        totalProducts: 0,
        created: new Date(),
        updated: new Date(),
      });
    });
    return { brandId: slug, brandName: data.brandName };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
