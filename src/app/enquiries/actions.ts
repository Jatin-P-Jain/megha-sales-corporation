"use server";

import { fireStore } from "@/firebase/server";
import { Enquiry } from "@/types/enquiry";
import { FullUser } from "@/types/user";
import { cookies } from "next/headers";

type EnquiryStatus = Enquiry["status"];
type EnquiryConversation = NonNullable<Enquiry["conversation"]>[number];

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

    return { success: true, enquiryId: docRef.id };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

export const updateEnquiryStatus = async ({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: EnquiryStatus;
}) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    throw new Error("Unauthorized - No token found");
  }

  const docRef = fireStore.collection("enquiries").doc(enquiryId);

  try {
    await fireStore.runTransaction(async (txn) => {
      const snapshot = await txn.get(docRef);

      if (!snapshot.exists) {
        throw new Error("Enquiry not found");
      }

      const existingEnquiry = snapshot.data() as Enquiry;

      const updatedEnquiry: Enquiry = {
        ...existingEnquiry,
        status,
        updatedAt: new Date().toISOString(),
      };

      txn.set(docRef, updatedEnquiry);
    });

    return {
      success: true,
      enquiryId,
      status,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

export const replyToEnquiry = async ({
  enquiryId,
  replyText,
  user,
  isAdminReply = false,
}: {
  enquiryId: string;
  replyText: string;
  user: FullUser;
  isAdminReply?: boolean;
}) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    throw new Error("Unauthorized - No token found");
  }

  const docRef = fireStore.collection("enquiries").doc(enquiryId);

  try {
    await fireStore.runTransaction(async (txn) => {
      const snapshot = await txn.get(docRef);

      if (!snapshot.exists) {
        throw new Error("Enquiry not found");
      }

      const existingEnquiry = snapshot.data() as Enquiry;

      const newReply: EnquiryConversation = {
        text: replyText.trim(),
        messageBy: user,
        sentAt: new Date().toISOString(),
      };

      const updatedEnquiry: Enquiry = {
        ...existingEnquiry,
        conversation: [...(existingEnquiry.conversation ?? []), newReply],
        status:
          isAdminReply && existingEnquiry.status === "pending"
            ? "in-progress"
            : existingEnquiry.status,
        updatedAt: new Date().toISOString(),
      };

      txn.set(docRef, updatedEnquiry);
    });

    return {
      success: true,
      enquiryId,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
