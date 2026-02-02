"use server";

import { auth, fireStore } from "@/firebase/server";
import { OrderStatus } from "@/types/order";
import { cookies } from "next/headers";

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
) => {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("firebaseAuthToken")?.value;

  if (!authToken) {
    return { error: true, message: "Unauthorized: No auth token" };
  }

  const verifiedToken = await auth.verifyIdToken(authToken);
  const isAdmin = verifiedToken?.admin;

  if (!isAdmin) {
    return { error: true, message: "Forbidden: Admin only" };
  }

  const validStatuses = ["pending", "packing", "dispatch"];
  if (!validStatuses.includes(newStatus)) {
    return { error: true, message: "Invalid status" };
  }

  try {
    const orderRef = fireStore.collection("orders").doc(orderId);
    await orderRef.update({ status: newStatus });
  } catch (error) {
    console.error(`❌ Failed to update order ${orderId}:`, error);
  }
};
