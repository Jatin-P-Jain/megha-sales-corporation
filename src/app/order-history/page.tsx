export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import OrdersList from "./orders-list";
import { getOrderById, getOrders, getUserOrders } from "@/data/orders";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import OrderStatusChips from "@/components/custom/order-status-chips";
import clsx from "clsx";
import { OrderStatus } from "@/types/order";

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; orderId?: string; status?: string }>;
}) {
  // 1) auth
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verified = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = Boolean(verified?.admin);
  const isUser = Boolean(verified);

  const searchParamValues = await searchParams;

  // 2) parse pagination + optional single‐order
  const pageRaw = parseInt(searchParamValues.page || "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : pageRaw;
  const requestedOrderId = searchParamValues.orderId ?? "";
  const statusParam = searchParamValues.status ?? "";

  const orderStatusFilter: OrderStatus[] = [];
  if (statusParam) {
    if (Array.isArray(statusParam))
      statusParam.forEach((status) => {
        orderStatusFilter.push(status as OrderStatus);
      });
    else {
      orderStatusFilter.push(statusParam as OrderStatus);
    }
  }

  // 3) pick the right promise
  let ordersPromise;
  if (isAdmin && !requestedOrderId) {
    // admin: fetch all, unfiltered
    ordersPromise = getOrders({
      filters: { status: orderStatusFilter },
      pagination: { page, pageSize: 5 },
    });
  } else if (isUser) {
    // regular user: only their orders
    if (requestedOrderId) {
      ordersPromise = getOrderById(requestedOrderId);
    } else {
      ordersPromise = getUserOrders(verified?.uid, {
        filters: { status: orderStatusFilter },
        pagination: { page, pageSize: 5 },
      });
    }
  } else {
    // not logged in at all: empty list
    ordersPromise = Promise.resolve({ data: [], totalPages: 0 });
  }

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      {/* header */}
      <div
        className={clsx(
          "fixed inset-x-0 top-0 z-30 mx-auto flex h-45 w-full max-w-screen-lg flex-col justify-end rounded-b-lg bg-white px-4 py-2 shadow-md md:h-50",
          requestedOrderId && "!h-40 md:!h-45",
        )}
      >
        <div className="mx-auto w-full max-w-screen-lg px-0 pt-4 md:pt-6">
          <EllipsisBreadCrumbs
            items={
              requestedOrderId
                ? [
                    {
                      href: isAdmin ? "/admin-dashboard" : "/",
                      label: isAdmin ? "Admin Dashboard" : "Home",
                    },
                    { href: "/account", label: "My Account" },
                    {
                      href: "/order-history",
                      label: isAdmin ? "Order Book" : "Order History",
                    },
                    { label: "Order Details" },
                  ]
                : [
                    {
                      href: isAdmin ? "/admin-dashboard" : "/",
                      label: isAdmin ? "Admin Dashboard" : "Home",
                    },
                    { href: "/account", label: "My Account" },
                    { label: isAdmin ? "Order Book" : "Order History" },
                  ]
            }
          />
          <h1 className="py-2 text-xl font-semibold text-cyan-950 md:text-2xl">
            {requestedOrderId
              ? "Order Details"
              : isAdmin
                ? "Order Book"
                : "Order History"}
          </h1>
          {!requestedOrderId && (
            <div className="flex w-full items-center justify-between pl-2">
              <div className="text-muted-foreground text-sm">Filters :</div>
              <OrderStatusChips />
            </div>
          )}
        </div>
      </div>

      {/* content area */}
      <div
        className={`flex-1 overflow-y-auto px-4 ${
          isUser ? "pt-30 md:pt-35" : "pt-20"
        }`}
      >
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          }
        >
          <OrdersList
            requestedOrderId={requestedOrderId}
            ordersPromise={ordersPromise}
            page={page}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </div>
  );
}
