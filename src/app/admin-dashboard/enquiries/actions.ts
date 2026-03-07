"use server";

import { fireStore } from "@/firebase/server";
import { Enquiry } from "@/types/enquiry";

import { cookies } from "next/headers";

export const saveEnquiry = async (enquiryData: Enquiry) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    throw new Error("Unauthorized - No token found");
  }

  const docRef = fireStore.collection("enquiries").doc(enquiryData.id);

  try {
    await fireStore.runTransaction(async (txn) => {
      txn.set(docRef, {
        ...enquiryData,
      } as Enquiry);
    });
    return { enquiryId: docRef.id };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
