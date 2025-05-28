"use server";

import { auth, fireStore } from "@/firebase/server";
import { Order, OrderData } from "@/types/order";

export const createOrder = async (data: OrderData, authtoken: string) => {
  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
  try {
    // 2) Pick the top-level collection
    const ordersCol = fireStore.collection("orders");

    // 3) Generate auto-ID and write
    const newRef = ordersCol.doc();
    const now = new Date();
    const orderData: Omit<Order, "id"> = {
      ...data,
      userId: verifiedToken.uid,
      status: "pending",
      createdAt: now.toISOString(),
    };
    await newRef.set(orderData);

    // 4) Return the generated ID + status
    return { orderId: newRef.id, status: orderData.status };
  } catch (e: unknown) {
    console.log("e -- ", { e });

    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
