export const dynamic = "force-dynamic";
import OrdersList from "./orders-list";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import OrderStatusChips from "@/components/custom/order-status-chips";
import clsx from "clsx";
import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; orderId?: string; status?: string }>;
}) {
  // 1) auth
  const verifiedToken =
    await requireProfileCompleteOrRedirect("/order-history");
  const isAdmin = Boolean(verifiedToken?.admin);

  const searchParamValues = await searchParams;
  const requestedOrderId = searchParamValues.orderId ?? "";

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      {/* header */}
      <div
        className={clsx(
          "fixed inset-x-0 top-0 z-30 mx-auto flex h-43 w-full max-w-6xl flex-col justify-end rounded-b-lg bg-white px-4 py-2 shadow-md md:h-50",
          requestedOrderId && "!h-40 md:!h-45",
        )}
      >
        <div className="mx-auto w-full px-0 pt-4 md:pt-6">
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
            <div className="flex w-full items-center justify-between">
              <div className="text-muted-foreground text-xs md:text-sm">
                Order Status :
              </div>
              <OrderStatusChips />
            </div>
          )}
        </div>
      </div>

      {/* content area */}
      <div
        className={`flex-1 overflow-y-auto pt-25 ${requestedOrderId ? "pt-30!" : ""}`}
      >
        <OrdersList
          isAdmin={isAdmin}
          userId={verifiedToken?.uid}
          requestedOrderId={requestedOrderId}
        />
      </div>
    </div>
  );
}
