import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import Link from "next/link";
import Orders from "./orders";

export default async function OrdersList({
  requestedOrderId,
  ordersPromise,
  page,
  isAdmin,
}: {
  requestedOrderId?: string;
  ordersPromise: Promise<{
    data: Order[];
    totalPages: number;
    totalItems?: number;
  }>;
  page: number;
  isAdmin: boolean;
}) {
  const [orders] = await Promise.all([ordersPromise]);
  const { data, totalPages } = orders;

  return (
    <>
      {data.length > 0 && (
        <div className="flex h-full w-full flex-1 flex-col justify-between gap-4">
          <Orders orderData={data} isAdmin={isAdmin} />
          {requestedOrderId ? (
            <Button className="mx-auto w-3/4" asChild>
              <Link href={"/order-history"}>View all orders</Link>
            </Button>
          ) : (
            <div className="flex w-full items-center justify-center gap-4 p-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const newSearchParams = new URLSearchParams();
                newSearchParams.set("page", `${i + 1}`);
                return (
                  <Button
                    asChild={page != i + 1}
                    disabled={i + 1 === page}
                    key={i}
                    variant={"outline"}
                    className="h-0 min-h-0 p-3"
                  >
                    <Link href={`/order-history?${newSearchParams}`}>
                      {i + 1}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {data.length === 0 && (
        <div className="text-center font-medium text-cyan-900">No Orders!</div>
      )}
    </>
  );
}
