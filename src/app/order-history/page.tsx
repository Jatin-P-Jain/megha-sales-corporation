export const dynamic = "force-dynamic";
import OrdersList from "./orders-list";
import OrderFilters from "@/components/custom/order-filters";
import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";

export default async function OrderHistoryPage() {
  // 1) auth
  const verifiedToken =
    await requireProfileCompleteOrRedirect("/order-history");
  const isAdmin = Boolean(verifiedToken?.admin);

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-42 w-full max-w-5xl flex-col items-start justify-end rounded-lg bg-white p-3 shadow-md md:h-48`}
      >
        <div className="flex w-full flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-cyan-950">
            {isAdmin ? "Order Book" : "Order History"}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Track all the orders.
          </p>

          <div className="flex w-full items-center justify-between gap-2">
            {/* <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
              Order Status:
            </span> */}
            <OrderFilters isAdmin={isAdmin} />
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto pt-25 md:pt-24`}>
        <OrdersList isAdmin={isAdmin} userId={verifiedToken?.uid} />
      </div>
    </div>
  );
}
