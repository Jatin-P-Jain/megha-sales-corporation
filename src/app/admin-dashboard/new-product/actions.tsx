"use server";

import { auth, fireStore } from "@/firebase/server";
import { productDataSchema } from "@/validation/productSchema";

export const createProduct = async (
  data: {
    brandName: string;
    companyName: string;
    vehicleCompany: string;
    vehicleName: string;
    partNumber: string;
    partName: string;
    price: number;
    discount: number;
    gst: number;
    description?: string;
    status: "draft" | "for-sale" | "discontinued" | "out-of-stock";
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

  const validation = productDataSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const product = await fireStore
    .collection("products")
    .add({ ...data, created: new Date(), updated: new Date() });

  return { productId: product.id };
};
