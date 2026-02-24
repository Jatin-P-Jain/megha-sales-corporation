// components/custom/responsive-product-filters.tsx
"use client";

import React, { useMemo, useCallback } from "react";
import clsx from "clsx";
import useIsMobile from "@/hooks/useIsMobile";
import CategoryFilter from "./category-filter";
import MoreFilters from "./more-filters";
import CartOverview from "./cart-overview";
import StatusSelect from "./status-filter";
import { Button } from "../ui/button";
import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Separator } from "../ui/separator";
import { FilterOptions } from "@/types/filterOptions";
import { SortBySelect } from "./sort-products";

const ResponsiveProductFilters: React.FC<{
  isAdmin: boolean;
  isUser: boolean;
  brandId?: string;
  filterOptions: FilterOptions;
}> = ({ isAdmin, isUser, filterOptions, brandId }) => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- derive categories (memo) ---
  const categories = useMemo(() => {
    let cats: string[] = [];

    if (brandId) {
      const brandIds = brandId.split(",").filter(Boolean);
      const brandArr = filterOptions.brands.filter((b) =>
        brandIds.includes(b.id),
      );
      if (brandArr.length > 0) cats = brandArr.flatMap((b) => b.categories);
    } else {
      cats = filterOptions.brands.flatMap((b) => b.categories);
    }

    return Array.from(new Set(cats)).sort();
  }, [brandId, filterOptions.brands]);

  // --- read current filter values ---
  const brandIdValue = searchParams.get("brandId") || "";
  const statusValue = searchParams.get("status") || "";
  const categoryValue = searchParams.get("category") || "";
  const vehicleCompanyValue = searchParams.get("vehicleCompany") || "";
  const priceValue = searchParams.get("price") || "";
  const discountValue = searchParams.get("discount") || "";
  const sortValue = searchParams.get("sort") || "";

  const isFilterApplied = useMemo(() => {
    return (
      brandIdValue.split(",").filter(Boolean).length > 1 ||
      !!statusValue ||
      !!categoryValue ||
      !!vehicleCompanyValue ||
      !!priceValue ||
      !!discountValue
    );
  }, [
    brandIdValue,
    statusValue,
    categoryValue,
    vehicleCompanyValue,
    priceValue,
    discountValue,
  ]);

  // --- central URL replace helper ---
  const replaceParams = useCallback(
    (
      updater: (sp: URLSearchParams) => void,
      opts?: { resetPage?: boolean },
    ) => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      updater(sp);
      if (opts?.resetPage) sp.set("page", "1");
      router.replace(`/products-list?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const applySorting = useCallback(
    (newValue: string) => {
      replaceParams(
        (sp) => {
          if (!newValue) sp.delete("sort");
          else sp.set("sort", newValue);
        },
        { resetPage: true },
      );
    },
    [replaceParams],
  );

  const clearAll = useCallback(() => {
    // Close to your existing behavior: go to page 1 and clear all filters
    router.replace(`/products-list?page=1`);
  }, [router]);

  return (
    <>
      {isMobile &&
        (isAdmin ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="mx-auto flex w-full flex-col gap-2 pb-2">
              <div className="grid w-full grid-cols-[fit-content(3ch)_fit-content(30ch)_max-content_max-content_fit-content(5ch)] items-center justify-start gap-2">
                <span className="text-muted-foreground w-full text-xs">
                  Filter by :
                </span>

                <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                  <StatusSelect />
                </div>

                <div className="flex h-full items-center justify-center gap-4">
                  <Separator
                    orientation="vertical"
                    className="bg-muted h-full"
                  />
                  <MoreFilters
                    showText={false}
                    filterOptions={filterOptions}
                    filterActive={isFilterApplied}
                  />
                </div>

                {isFilterApplied && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-red-800"
                    onClick={clearAll}
                  >
                    <XCircle />
                  </Button>
                )}

                <SortBySelect value={sortValue} onChange={applySorting} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 pb-2">
            <div className="grid w-full grid-cols-[fit-content(3ch)_fit-content(30ch)_max-content_max-content_fit-content(5ch)] items-center gap-2">
              <span className="text-muted-foreground text-xs text-wrap">
                Filter by :
              </span>

              <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                <CategoryFilter categories={categories} />
              </div>

              <div className="flex h-full items-center justify-center gap-2">
                <Separator orientation="vertical" className="bg-muted h-full" />
                <MoreFilters
                  showText={false}
                  filterOptions={filterOptions}
                  filterActive={isFilterApplied}
                />
              </div>

              {isFilterApplied && (
                <Button
                  type="button"
                  variant="secondary"
                  className="text-red-800"
                  onClick={clearAll}
                >
                  <XCircle />
                </Button>
              )}

              <SortBySelect value={sortValue} onChange={applySorting} />
            </div>

            {isUser ? <CartOverview isUser /> : null}
          </div>
        ))}

      {!isMobile &&
        (isAdmin ? (
          <div
            className={clsx(
              "inline-grid w-fit max-w-full grid-cols-[max-content_fit-content(40ch)_fit-content(40ch)_max-content] items-center gap-2 pb-4",
              isFilterApplied &&
                "grid-cols-[max-content_fit-content(40ch)_fit-content(40ch)_max-content_max-content]",
            )}
          >
            <div className="text-muted-foreground shrink-0 text-xs">
              Quick Filters :
            </div>

            <div className="w-fit max-w-[100%] min-w-0 shrink-0">
              <StatusSelect />
            </div>

            <div className="w-fit max-w-[100%] min-w-0 shrink-0">
              <CategoryFilter categories={categories} />
            </div>

            <div className="flex h-full items-center justify-center gap-4">
              <Separator orientation="vertical" className="bg-muted h-full" />
              <MoreFilters
                filterOptions={filterOptions}
                filterActive={isFilterApplied}
              />
            </div>

            {isFilterApplied && (
              <Button
                type="button"
                variant="secondary"
                className="text-red-800"
                onClick={clearAll}
              >
                <XCircle /> Clear
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-2">
            <div
              className={clsx(
                "grid w-full items-center justify-start gap-4",
                isFilterApplied
                  ? "grid-cols-[minmax(min-content,1fr)_max-content_fit-content(40ch)_max-content_max-content_max-content]"
                  : "grid-cols-[minmax(min-content,1fr)_max-content_fit-content(40ch)_max-content_max-content]",
              )}
            >
              <span className="text-muted-foreground text-xs">Filter by :</span>

              <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                <CategoryFilter categories={categories} />
              </div>

              <div className="flex h-full items-center justify-center gap-4">
                <Separator orientation="vertical" className="bg-muted h-full" />
                <MoreFilters
                  filterOptions={filterOptions}
                  filterActive={isFilterApplied}
                />
              </div>

              {isFilterApplied && (
                <Button
                  type="button"
                  variant="secondary"
                  className="text-red-800"
                  onClick={clearAll}
                >
                  <XCircle /> Clear
                </Button>
              )}

              <SortBySelect value={sortValue} onChange={applySorting} />
            </div>

            {isUser ? <CartOverview isUser /> : null}
          </div>
        ))}
    </>
  );
};

export default ResponsiveProductFilters;
