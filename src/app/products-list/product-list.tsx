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
import { useAuthState } from "@/context/useAuth";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFireStore";
import { Product } from "@/types/product";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo } from "react";

export default function ProductList({ isAdmin }: { isAdmin: boolean }) {
  const { clientUser } = useAuthState();
  const accountStatus = clientUser?.accountStatus;

  const PAGE_SIZE = process.env.NEXT_PUBLIC_PAGE_SIZE
    ? parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE, 10)
    : 10;

  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page") || "1";
  const pageFromUrl = Math.max(parseInt(pageParam, 10) || 1, 1);

  const brandIdValue = searchParams.get("brandId") || "";
  const statusValue = searchParams.get("status") || "";
  const categoryValue = searchParams.get("category") || "";
  const vehicleCompanyValue = searchParams.get("vehicleCompany") || "";
  const priceValue = searchParams.get("price") || "";
  const discountValue = searchParams.get("discount") || "";
  const sortValue = searchParams.get("sort") || "";

  const [orderBy, orderDir] = useMemo(() => {
    if (!sortValue) return ["updated", "desc"] as [string, "asc" | "desc"];
    const [field, dir] = sortValue.split("-");
    return [
      field || "updated",
      (dir === "asc" ? "asc" : "desc") as "asc" | "desc",
    ];
  }, [sortValue]);

  const filters = useMemo(() => {
    const brandIds = brandIdValue
      ? brandIdValue.split(",").filter(Boolean)
      : [];
    const statuses = statusValue ? statusValue.split(",").filter(Boolean) : [];
    const categories = categoryValue
      ? categoryValue.split(",").filter(Boolean)
      : [];
    const vehicleCompanies = vehicleCompanyValue
      ? vehicleCompanyValue.split(",").filter(Boolean)
      : [];

    const [minPriceValue, maxPriceValue] = priceValue
      ? priceValue.split(",")
      : [];
    const [minDiscountValue, maxDiscountValue] = discountValue
      ? discountValue.split(",")
      : [];

    const minPrice = minPriceValue ? parseInt(minPriceValue, 10) : undefined;
    const maxPrice = maxPriceValue ? parseInt(maxPriceValue, 10) : undefined;
    const minDiscount = minDiscountValue
      ? parseInt(minDiscountValue, 10)
      : undefined;
    const maxDiscount = maxDiscountValue
      ? parseInt(maxDiscountValue, 10)
      : undefined;

    return [
      ...(brandIds.length > 0
        ? [{ field: "brandId", op: "in" as const, value: brandIds }]
        : []),

      ...(statuses.length > 0
        ? [{ field: "status", op: "in" as const, value: statuses }]
        : !isAdmin
          ? [{ field: "status", op: "==" as const, value: "for-sale" }]
          : []),

      ...(categories.length > 0
        ? [{ field: "partCategory", op: "in" as const, value: categories }]
        : []),

      ...(vehicleCompanies.length > 0
        ? [
            {
              field: "vehicleCompany",
              op: "in" as const,
              value: vehicleCompanies,
            },
          ]
        : []),

      ...(minPrice !== undefined
        ? [{ field: "price", op: ">=" as const, value: minPrice }]
        : []),
      ...(maxPrice !== undefined
        ? [{ field: "price", op: "<=" as const, value: maxPrice }]
        : []),

      ...(minDiscount !== undefined
        ? [{ field: "discount", op: ">=" as const, value: minDiscount }]
        : []),
      ...(maxDiscount !== undefined
        ? [{ field: "discount", op: "<=" as const, value: maxDiscount }]
        : []),
    ];
  }, [
    brandIdValue,
    statusValue,
    categoryValue,
    vehicleCompanyValue,
    priceValue,
    discountValue,
    isAdmin,
  ]);

  const queryKey = useMemo(() => {
    return JSON.stringify({
      brandIdValue,
      statusValue,
      categoryValue,
      vehicleCompanyValue,
      priceValue,
      discountValue,
      orderBy,
      orderDir,
      PAGE_SIZE,
      isAdmin,
    });
  }, [
    brandIdValue,
    statusValue,
    categoryValue,
    vehicleCompanyValue,
    priceValue,
    discountValue,
    orderBy,
    orderDir,
    PAGE_SIZE,
    isAdmin,
  ]);

  const {
    data,
    loading,
    hasMore,
    currentPage,
    totalItems,
    countLoading,
    loadPage,
  } = usePaginatedFirestore<Product>({
    collectionPath: "products",
    pageSize: PAGE_SIZE,
    orderByField: orderBy,
    orderDirection: orderDir,
    filters,
    realtime: true,
    queryKey,
    countRefreshMs: 30000,
  });

  useEffect(() => {
    loadPage(pageFromUrl);
  }, [pageFromUrl, loadPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", String(page));
      router.replace(`/products-list?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const start = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end =
    totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  const pageLinks = useMemo(() => {
    const nodes: React.ReactNode[] = [];
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
        nodes.push(
          <PaginationItem key={`ellipsis-${i}`}>
            <span className="text-muted-foreground px-2">...</span>
          </PaginationItem>,
        );
      }

      const isCurrent = i === currentPage;
      nodes.push(
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

    return nodes;
  }, [currentPage, totalPages, handlePageChange]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 items-center justify-center">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col">
      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-xs md:text-sm">
        Page {currentPage} • Showing {start}–{end} of{" "}
        {countLoading ? "…" : totalItems} results
      </p>

      <div className="flex h-full min-h-[calc(100vh-200px)] w-full flex-1 flex-col justify-between gap-4 py-2">
        <div className="flex w-full flex-1 flex-grow flex-col gap-5">
          {data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              isAccountApproved={accountStatus === "approved"}
            />
          ))}
        </div>

        <Pagination className="z-50">
          <PaginationContent className="w-full items-center justify-center">
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                />
              </PaginationItem>
            )}

            {pageLinks}

            {hasMore && currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
