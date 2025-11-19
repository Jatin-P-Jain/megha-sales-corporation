"use client";

import ProductCard from "@/components/custom/product-card";
import ProductCardSkeleton from "@/components/custom/product-card-skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFireStore";
import { PAGE_SIZE } from "@/lib/utils";
import { Product } from "@/types/product";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ProductList({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previousFiltersRef = useRef<string>("");

  const brandIdValue = searchParams.get("brandId") || "";
  const statusValue = searchParams.get("status") || "";
  const categoryValue = searchParams.get("category") || "";
  const priceValue = searchParams.get("price") || undefined;
  const discountValue = searchParams.get("discount") || undefined;
  const sortValue = searchParams.get("sort") || undefined;

  const [minPriceValue, maxPriceValue] = priceValue
    ? priceValue.split(",")
    : [undefined, undefined];
  const [minDiscountValue, maxDiscountValue] = discountValue
    ? discountValue.split(",")
    : [undefined, undefined];

  const [orderBy, orderDir] = (() => {
    if (!sortValue) return ["updated", "desc"] as [string, "asc" | "desc"];
    const [field, dir] = sortValue.split("-");
    return [field, dir] as [string, "asc" | "desc"];
  })();
  const filtersOnly = {
    brandId: brandIdValue,
    status: statusValue,
    category: categoryValue,
  };
  const filterKey = JSON.stringify(filtersOnly);

  // Convert comma-separated strings to arrays
  const brandIds = brandIdValue ? brandIdValue.split(",") : [];
  const statuses = statusValue ? statusValue.split(",") : [];
  const categories = categoryValue ? categoryValue.split(",") : [];
  const minPrice = minPriceValue ? parseInt(minPriceValue) : undefined;
  const maxPrice = maxPriceValue ? parseInt(maxPriceValue) : undefined;
  const minDiscount = minDiscountValue ? parseInt(minDiscountValue) : undefined;
  const maxDiscount = maxDiscountValue ? parseInt(maxDiscountValue) : undefined;

  // Construct filters
  const filters = [
    ...(brandIds.length > 0
      ? [
          {
            field: "brandId",
            op: "in" as const,
            value: brandIds,
          },
        ]
      : []),
    ...(statuses.length > 0
      ? [
          {
            field: "status",
            op: "in" as const,
            value: statuses,
          },
        ]
      : []),
    ...(categories.length > 0
      ? [
          {
            field: "partCategory",
            op: "in" as const,
            value: categories,
          },
        ]
      : []),
    // Add price range filters
    ...(minPrice !== undefined
      ? [
          {
            field: "price",
            op: ">=" as const,
            value: minPrice,
          },
        ]
      : []),
    ...(maxPrice !== undefined
      ? [
          {
            field: "price",
            op: "<=" as const,
            value: maxPrice,
          },
        ]
      : []),
    ...(minDiscount !== undefined
      ? [
          {
            field: "discount",
            op: ">=" as const,
            value: minDiscount,
          },
        ]
      : []),
    ...(maxDiscount !== undefined
      ? [
          {
            field: "discount",
            op: "<=" as const,
            value: maxDiscount,
          },
        ]
      : []),
  ];

  const {
    data,
    loading,
    hasMore,
    currentPage,
    loadPage,
    totalItems,
    resetPagination,
  } = usePaginatedFirestore({
    collectionPath: "products",
    pageSize: PAGE_SIZE,
    orderByField: orderBy,
    orderDirection: orderDir,
    filters: filters,
  });

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // after loading becomes false
  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true);
    }
  }, [loading]);

  // ⏮ Reset to page 1 if filters change
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      previousFiltersRef.current = filterKey;

      // Reset page to 1 in URL
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`/products-list?${sp.toString()}`);

      // Reset pagination state
      resetPagination();
    }
  }, [filterKey, resetPagination, router, searchParams]);

  const handlePageChange = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", `${page}`);
    router.replace(`/products-list?${sp.toString()}`);
    loadPage(page);
  };

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  if (loading || !hasLoadedOnce) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4 px-4 py-6">
        {[...Array(6)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && hasLoadedOnce && data.length === 0) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 items-center justify-center">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col">
      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-sm">
        Page {currentPage} • Showing {start}–{end} of {totalItems} results
      </p>
      {data.length > 0 && (
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col justify-between gap-4 py-2">
          <div className="flex w-full flex-1 flex-grow flex-col gap-5">
            {data.map((product: Product, index: number) => (
              <ProductCard key={index} product={product} isAdmin={isAdmin} />
            ))}
          </div>

          <Pagination>
            <PaginationContent className="w-full items-center justify-center">
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    // href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                </PaginationItem>
              )}

              {(() => {
                const pageLinks = [];
                const visiblePages = new Set<number>();

                if (totalPages <= 7) {
                  // Show all pages if total pages are 7 or fewer
                  for (let i = 1; i <= totalPages; i++) {
                    visiblePages.add(i);
                  }
                } else {
                  // Always show first and last page
                  visiblePages.add(1);
                  visiblePages.add(totalPages);

                  // Show current page and two pages before & after
                  for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                    if (i > 1 && i < totalPages) {
                      visiblePages.add(i);
                    }
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
                        // href="#"
                        onClick={() => handlePageChange(i)}
                        isActive={isCurrent}
                        className={clsx(
                          isCurrent && "bg-primary font-bold text-white",
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
                    // href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
