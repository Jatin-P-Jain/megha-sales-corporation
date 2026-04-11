"use server";

import { auth, fireStore } from "@/firebase/server";
import { generateSequenceId } from "@/lib/firebase/generateSequenceId";
import { Order, OrderEventTimelineEvent } from "@/types/order";
import { UserData } from "@/types/user";

type CreateOrderPayload = Omit<
  Order,
  "id" | "user" | "status" | "createdAt" | "updatedAt" | "orderEventTimeline"
>;

export const createOrder = async (
  data: CreateOrderPayload,
  userData: UserData,
  authtoken: string,
) => {
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
    const customOrderId = await generateSequenceId("orders");

    // 2. Use customOrderId as document ID
    const newRef = ordersCol.doc(customOrderId);
    const now = new Date();
    const nowIso = now.toISOString();

    const orderCreatedEvent: OrderEventTimelineEvent = {
      id: `evt_${Date.now()}`,
      type: "order_created",
      label: "Order placed",
      status: "pending",
      createdAt: nowIso,
    };

    const orderData: Omit<Order, "id"> = {
      ...data,
      user: userData,
      status: "pending",
      createdAt: nowIso,
      updatedAt: nowIso,
      orderEventTimeline: [orderCreatedEvent],
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
