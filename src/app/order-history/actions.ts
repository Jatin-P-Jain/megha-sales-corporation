"use server";

import { auth, fireStore } from "@/firebase/server";
import { Order, OrderEventTimelineEvent, OrderStatus } from "@/types/order";
import { UserData } from "@/types/user";
import { UserRole } from "@/types/userGate";
import { cookies } from "next/headers";

type UpdaterContextInput = Partial<UserData> & {
  userRole: UserRole | null;
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  updaterContext?: UpdaterContextInput
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
    const orderSnapshot = await orderRef.get();
    if (!orderSnapshot.exists) {
      return { error: true, message: "Order not found" };
    }

    const existingOrder = orderSnapshot.data() as Order;
    const nowIso = new Date().toISOString();

    const safeContext = updaterContext
      ? (JSON.parse(JSON.stringify(updaterContext)) as UpdaterContextInput)
      : undefined;

    const baseUpdatedBy: UserData = {
      uid: verifiedToken.uid,
      userId: verifiedToken.uid,
      email: verifiedToken.email ?? null,
      phone: null,
      displayName: verifiedToken.name ?? verifiedToken.email ?? "Admin",
    };

    const updatedBy: UserData = {
      ...baseUpdatedBy,
      ...(safeContext ?? {}),
      uid: verifiedToken.uid,
      userId: safeContext?.userId ?? verifiedToken.uid,
      email: safeContext?.email ?? verifiedToken.email ?? null,
      displayName:
        safeContext?.displayName ??
        verifiedToken.name ??
        verifiedToken.email ??
        "Admin",
    };

    const updaterRole = safeContext?.userRole ?? "Admin";

    const statusUpdateEvent: OrderEventTimelineEvent = {
      id: `evt_${Date.now()}`,
      type: "status_updated",
      label: "Order status updated",
      detail: `${updatedBy?.displayName ?? "System"} (${
        updaterRole ?? "Admin"
      })`,
      status: newStatus,
      createdAt: nowIso,
      updatedBy: JSON.parse(JSON.stringify(updatedBy)) as UserData,
    };

    const existingTimeline = Array.isArray(existingOrder?.orderEventTimeline)
      ? existingOrder.orderEventTimeline
      : [];

    await orderRef.update({
      status: newStatus,
      updatedAt: nowIso,
      orderEventTimeline: [...existingTimeline, statusUpdateEvent],
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to update order ${orderId}:`, error);
    return { error: true, message: "Failed to update order" };
  }
};
