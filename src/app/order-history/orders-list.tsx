"use client";

import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/types/order";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFireStore";
import type { Order } from "@/types/order";

function OrdersSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-2/3 rounded bg-zinc-200" />
          <div className="mt-3 h-3 w-1/2 rounded bg-zinc-200" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="h-8 rounded bg-zinc-200" />
            <div className="h-8 rounded bg-zinc-200" />
            <div className="h-8 rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersList({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previousFiltersRef = useRef<string>("");

  const requestedOrderId = searchParams.get("orderId") ?? undefined;
  const showSingle = !!requestedOrderId;

  // Keep URL as the source of truth (same as ProductList)
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : pageRaw;

  /**
   * ✅ FIX: Memoize a stable key first, then derive `statuses` from it.
   * Supports:
   * - ?status=pending&status=approved
   * - ?status=pending,approved
   */
  const statusKey = useMemo(() => {
    const all = searchParams.getAll("orderStatus");
    if (all.length > 0) return all.join(",");
    return searchParams.get("orderStatus") ?? "";
  }, [searchParams]);

  const statuses = useMemo(() => {
    if (!statusKey.trim()) return [] as OrderStatus[];
    return statusKey.split(",").filter(Boolean) as OrderStatus[];
  }, [statusKey]);

  const filterKey = useMemo(() => JSON.stringify({ statusKey }), [statusKey]);

  const filters = useMemo(() => {
    const f: {
      field: string;
      op: "==" | "in";
      value: OrderStatus[] | string;
    }[] = [];

    // If not admin, scope to user
    if (!isAdmin) {
      f.push({
        field: "user.uid",
        op: "==",
        value: userId ?? "__missing__",
      });
    }

    // Optional single-order view (if you use this UX)
    if (requestedOrderId) {
      f.push({ field: "__name__", op: "==", value: requestedOrderId });
    }

    // Status filter
    if (statuses.length > 0) {
      f.push({
        field: "status",
        op: "in",
        value: statuses.slice(0, 10) as OrderStatus[],
      });
    }

    return f;
  }, [isAdmin, userId, requestedOrderId, statuses]);

  const { data, loading, hasMore, currentPage, loadPage, totalItems } =
    usePaginatedFirestore<Order>({
      collectionPath: "orders",
      pageSize: PAGE_SIZE,
      filters,
      orderByField: "updatedAt",
      orderDirection: "desc",
    });

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // after loading becomes false
  useEffect(() => {
    if (!loading) setHasLoadedOnce(true);
  }, [loading]);

  // Keep hook in sync with URL page
  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterKey]);

  // Reset to page 1 if filters change (same logic as ProductList)
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      previousFiltersRef.current = filterKey;
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`/order-history?${sp.toString()}`);
    }
  }, [filterKey, router, searchParams]);

  const handlePageChange = (nextPage: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", `${nextPage}`);
    // when paging, don’t keep orderId pinned
    sp.delete("orderId");
    router.replace(`/order-history?${sp.toString()}`);
    loadPage(nextPage);
  };

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  if (loading || !hasLoadedOnce) {
    return <OrdersSkeleton />;
  }

  if (!loading && hasLoadedOnce && data.length === 0) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          {requestedOrderId
            ? `No Order found with Order ID: ${requestedOrderId}`
            : "No Orders!"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col">
      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-xs md:text-sm">
        Page {currentPage} • Showing {start}–{end} of {totalItems} results
      </p>

      {data.length > 0 && (
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col justify-between gap-4 py-2">
          <div className="flex w-full flex-1 flex-grow flex-col gap-5">
            <Orders orderData={data} isAdmin={isAdmin} />
          </div>

          {showSingle ? (
            <Button
              className="mx-auto w-3/4"
              onClick={() => router.push("/order-history")}
            >
              View all orders
            </Button>
          ) : (
            <Pagination className="z-50">
              <PaginationContent className="w-full items-center justify-center">
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                  </PaginationItem>
                )}

                {(() => {
                  const pageLinks = [];
                  const visiblePages = new Set<number>();

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) visiblePages.add(i);
                  } else {
                    visiblePages.add(1);
                    visiblePages.add(totalPages);

                    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                      if (i > 1 && i < totalPages) visiblePages.add(i);
                    }
                  }

                  let prev: number | null = null;

                  for (let i = 1; i <= totalPages; i++) {
                    if (!visiblePages.has(i)) continue;

                    if (prev !== null && i - prev > 1) {
                      pageLinks.push(
                        <PaginationItem key={`ellipsis-${i}`}>
                          <span className="text-muted-foreground px-2">
                            ...
                          </span>
                        </PaginationItem>,
                      );
                    }

                    const isCurrent = i === currentPage;
                    pageLinks.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => handlePageChange(i)}
                          isActive={isCurrent}
                          className={clsx(
                            isCurrent && "bg-primary font-bold text-white",
                            "cursor-pointer",
                          )}
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>,
                    );

                    prev = i;
                  }

                  return pageLinks;
                })()}

                {hasMore && currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
