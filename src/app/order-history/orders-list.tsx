"use client";

import { OrderStatus } from "@/types/order";
import Orders from "./orders";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFireStore";
import type { Order } from "@/types/order";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { PackageSearch } from "lucide-react";

function OrdersSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
        >
          <div className="h-5 w-2/3 rounded bg-zinc-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-zinc-200" />
          <div className="mt-5 space-y-2">
            <div className="h-4 w-full rounded bg-zinc-200" />
            <div className="h-4 w-11/12 rounded bg-zinc-200" />
            <div className="h-4 w-10/12 rounded bg-zinc-200" />
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
  const PAGE_SIZE = process.env.NEXT_PUBLIC_PAGE_SIZE
    ? parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE, 10)
    : 10;

  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const previousFiltersRef = useRef<string>("");

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

    // Status filter
    if (statuses.length > 0) {
      f.push({
        field: "status",
        op: "in",
        value: statuses.slice(0, 10) as OrderStatus[],
      });
    }

    return f;
  }, [isAdmin, userId, statuses]);

  const {
    data,
    loading,
    hasMore,
    currentPage,
    loadPage,
    totalItems,
  }: {
    data: Order[];
    loading: boolean;
    hasMore: boolean;
    currentPage: number;
    loadPage: (page: number) => void;
    totalItems: number;
  } = usePaginatedFirestore<Order>({
    collectionPath: "orders",
    pageSize: PAGE_SIZE,
    filters,
    orderByField: "updatedAt",
    orderDirection: "desc",
    realtime: true,
  });

  // Keep hook in sync with URL page
  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterKey]);

  // Reset to page 1 if filters change (same logic as ProductList)
  useEffect(() => {
    if (previousFiltersRef.current === filterKey) return;

    previousFiltersRef.current = filterKey;

    const currentPageInUrl = searchParams.get("page") ?? "1";
    if (currentPageInUrl === "1") return;

    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", "1");
    router.replace(`/order-history?${sp.toString()}`);
    // do NOT call loadPage here; your page effect will run when URL updates
  }, [filterKey, router, searchParams]);

  const handlePageChange = (nextPage: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", `${nextPage}`);
    router.replace(`/order-history?${sp.toString()}`);
  };

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  if (loading) {
    return <OrdersSkeleton />;
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-320px)] w-full flex-col items-center justify-center rounded-2xl px-4 text-center">
        <div className="mb-3 rounded-full border p-3">
          <PackageSearch className="text-muted-foreground h-6 w-6" />
        </div>
        <p className="text-foreground text-base font-semibold">No orders!</p>
        <p className="text-muted-foreground text-sm">
          Try changing status filters or check back after placing an order.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full flex-col">
      <p className="text-muted-foreground w-full text-center text-xs md:text-sm">
        Page {currentPage} • Showing {start}-{end} of {totalItems} results
      </p>

      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4 py-2">
        <div className="flex w-full flex-1 p-1">
          <Orders orderData={data} isAdmin={isAdmin} />
        </div>

        {totalPages > 1 ? (
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
                        <span className="text-muted-foreground px-2">...</span>
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
        ) : null}
      </div>
    </div>
  );
}
