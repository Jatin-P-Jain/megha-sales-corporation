import "server-only";
import { fireStore, getTotalPages } from "@/firebase/server";
import { CartProduct } from "@/types/cartProduct";
import { Order, OrderStatus } from "@/types/order";

type GetOrdersOptions = {
  filters?: {
    status?: OrderStatus[];
  };
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

export const getOrders = async (options?: GetOrdersOptions) => {
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;
  const status = options?.filters?.status || "";

  let ordersQuery = fireStore.collection("orders").orderBy("updatedAt", "desc");

  if (Array.isArray(status) && status.length > 0) {
    ordersQuery = ordersQuery.where("status", "in", status);
  }

  const ordersTotalPages = await getTotalPages(ordersQuery, pageSize);

  const ordersSnapshot = await ordersQuery
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .get();

  const orders = ordersSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    } as Order;
  });

  return { data: orders, totalPages: ordersTotalPages };
};

export const getOrderById = async (orderId: string) => {
  const orderSnapshot = await fireStore.collection("orders").doc(orderId).get();
  const rawOrderData = orderSnapshot.data()!;

  // build a pure‐JS object matching your Order type
  const order: Order = {
    id: orderSnapshot.id,
    user: rawOrderData?.user as {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
    },
    products: rawOrderData?.products as CartProduct[],
    totals: rawOrderData?.totals as {
      items: number;
      units: number;
      amount: number;
    },
    status: rawOrderData?.status as OrderStatus,
    address: rawOrderData?.address as string,
    createdAt: rawOrderData?.createdAt as string,
    updatedAt: rawOrderData?.updatedAt as string,
  };
  return { data: [order], totalPages: 1 };
};
export const getUserOrders = async (
  userId?: string,
  options?: GetOrdersOptions,
) => {
  if (!userId) {
    return { data: [], totalPages: 0 };
  }
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;
  const status = options?.filters?.status || "";

  let ordersQuery = fireStore
    .collection("orders")
    .where("user.id", "==", userId)
    .orderBy("updatedAt", "desc");

  if (Array.isArray(status) && status.length > 0) {
    ordersQuery = ordersQuery.where("status", "in", status);
  }

  const ordersTotalPages = await getTotalPages(ordersQuery, pageSize);

  const ordersSnapshot = await ordersQuery
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .get();
  const ordersData = ordersSnapshot.docs.map((orderItem) => {
    const rawOrderData = orderItem.data();
    const order: Order = {
      id: orderItem.id,
      user: rawOrderData?.user as {
        id: string;
        name?: string;
        email?: string;
        phone?: string;
      },
      products: rawOrderData?.products as CartProduct[],
      totals: rawOrderData?.totals as {
        items: number;
        units: number;
        amount: number;
      },
      status: rawOrderData?.status as OrderStatus,
      address: rawOrderData?.address as string,
      createdAt: rawOrderData?.createdAt as string,
      updatedAt: rawOrderData?.updatedAt as string,
    };
    return order;
  });

  return { data: ordersData, totalPages: ordersTotalPages };
};
