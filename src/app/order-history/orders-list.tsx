import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import Link from "next/link";
import Orders from "./orders";
import { PAGE_SIZE } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import clsx from "clsx";

export default async function OrdersList({
  requestedOrderId,
  ordersPromise,
  page,
  isAdmin,
  searchParamsValues,
}: {
  requestedOrderId?: string;
  ordersPromise: Promise<{
    data: Order[];
    totalPages: number;
    totalItems?: number;
  }>;
  page: number;
  isAdmin: boolean;
  searchParamsValues: {
    page?: string;
    status?: string;
    orderId?: string;
  };
}) {
  const pageSize = PAGE_SIZE;
  const [orders] = await Promise.all([ordersPromise]);
  const { data, totalPages, totalItems } = orders;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems ?? 0);

  return (
    <>
      {data.length > 0 && (
        <div className="flex h-full w-full flex-1 flex-col justify-between gap-4">
          <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-sm">
            Page {page} • Showing {start}–{end} of {totalItems} results
          </p>
          <Orders orderData={data} isAdmin={isAdmin} />
          {requestedOrderId ? (
            <Button className="mx-auto w-3/4" asChild>
              <Link href={"/order-history"}>View all orders</Link>
            </Button>
          ) : (
            <Pagination>
              <PaginationContent className="w-full items-center justify-center mb-3 md:mb-6">
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/products-list?page=${page - 1}`}
                    />
                  </PaginationItem>
                )}

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isCurrent = page === pageNum;
                  const newSearchParams = new URLSearchParams();
                  Object.entries(searchParamsValues).forEach(([key, value]) => {
                    if (value !== undefined) {
                      if (Array.isArray(value)) {
                        value.forEach((v) => newSearchParams.append(key, v));
                      } else {
                        newSearchParams.set(key, value);
                      }
                    }
                  });
                  newSearchParams.set("page", `${pageNum}`);

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href={`/products-list?${newSearchParams}`}
                        isActive={isCurrent}
                        className={clsx(
                          isCurrent && "bg-primary font-bold text-white",
                        )}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/products-list?page=${page + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
      {data.length === 0 && (
        <div className="text-center font-medium text-cyan-900">No Orders!</div>
      )}
    </>
  );
}
