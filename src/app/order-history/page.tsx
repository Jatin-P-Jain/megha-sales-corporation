export const dynamic = "force-dynamic";
import OrdersList from "./orders-list";
import OrderStatusChips from "@/components/custom/order-status-chips";
import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";

export default async function OrderHistoryPage() {
  // 1) auth
  const verifiedToken =
    await requireProfileCompleteOrRedirect("/order-history");
  const isAdmin = Boolean(verifiedToken?.admin);

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-5xl flex-col items-start justify-end rounded-lg bg-white p-3 shadow-md ${
          !isAdmin ? "h-42 md:h-58" : "h-42 md:h-48"
        }`}
      >
        <div className="flex w-full flex-col md:flex-row md:items-end md:justify-between gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-cyan-950 md:text-3xl">
            {isAdmin ? "Order Book" : "Order History"}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Track all the orders.
          </p>

          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs md:text-sm">
              Order Status:
            </span>
            <OrderStatusChips />
          </div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto ${
          !isAdmin ? "pt-25 md:pt-32" : "pt-25 md:pt-22"
        }`}
      >
        <OrdersList isAdmin={isAdmin} userId={verifiedToken?.uid} />
      </div>
    </div>
  );
}
