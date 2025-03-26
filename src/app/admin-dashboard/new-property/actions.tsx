"use server";

import { auth, fireStore } from "@/firebase/server";
import { propertyDataSchema } from "@/validation/propertySchema";
import { z } from "zod";

export const createProperty = async (
  data: {
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    description: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    status: "for-sale" | "draft" | "withdrawn" | "sold";
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

  const validation = propertyDataSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const property = await fireStore
    .collection("properties")
    .add({ ...data, created: new Date(), updated: new Date() });

  return { propertyId: property.id };
};


