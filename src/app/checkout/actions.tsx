"use server";

import { auth, fireStore } from "@/firebase/server";
import { Order, OrderData } from "@/types/order";
import { UserData } from "@/types/user";

// Helper to pad numbers
const pad = (num: number, size = 4) => num.toString().padStart(size, "0");

// Function to generate order ID
const generateOrderId = async (): Promise<string> => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = pad(now.getMonth() + 1, 2);
  const dd = pad(now.getDate(), 2);
  const hh = pad(now.getHours(), 2);
  const min = pad(now.getMinutes(), 2);

  const datePart = `${dd}${mm}${yy}`;
  const timePart = `${hh}${min}`;

  const counterRef = fireStore.collection("counters").doc("orders");

  const newCount = await fireStore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentCount = snapshot.exists ? snapshot.data()?.count || 0 : 0;
    const updatedCount = currentCount + 1;
    transaction.set(counterRef, { count: updatedCount }, { merge: true });
    return updatedCount;
  });
  const sequence = pad(newCount);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  const envPrefix = process.env.VERCEL_ENV === "production" ? "" : "D-";

  return `${envPrefix}MSC-${datePart}-${timePart}-${sequence}-${randomPart}`;
};

export const createOrder = async (data: OrderData, userData: UserData, authtoken: string) => {
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

    // 1. Generate custom Order ID
    const customOrderId = await generateOrderId();

    // 2. Use customOrderId as document ID
    const newRef = ordersCol.doc(customOrderId);
    const now = new Date();
    const orderData: Omit<Order, "id"> = {
      ...data,
      user: userData,
      status: "pending",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
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
