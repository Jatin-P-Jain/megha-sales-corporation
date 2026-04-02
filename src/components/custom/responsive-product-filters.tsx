"use client";

import React, { useMemo, useCallback } from "react";
import clsx from "clsx";
import useIsMobile from "@/hooks/useIsMobile";
import MoreFilters from "./more-filters";
import { Button } from "../ui/button";
import { XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FilterOptions } from "@/types/filterOptions";
import { SortBySelect } from "./sort-products";
import { useSafeRouter } from "@/hooks/useSafeRouter";

type Props = {
  isAdmin: boolean;
  // NOTE: isUser not used here anymore (cart overview is decoupled)
  brandId?: string;
  filterOptions: FilterOptions;
};

type CommonUIProps = {
  filterOptions: FilterOptions;
  isFilterApplied: boolean;
  sortValue: string;
  onClearAll: () => void;
  onSortChange: (v: string) => void;
  adminMode: boolean;
  mobileMode: boolean;
  onlyOneBrand: boolean;
};

function FilterRow({
  filterOptions,
  isFilterApplied,
  sortValue,
  onClearAll,
  onSortChange,
  adminMode,
  mobileMode,
  onlyOneBrand,
}: CommonUIProps) {
  // Admin quick filters differ from user quick filters

  if (mobileMode) {
    return (
      <div className="flex flex-col gap-1">
        <div className={"flex justify-between gap-3"}>
          <div
            className={clsx(
              "flex h-full w-full items-center justify-center gap-2 rounded-md border",
              isFilterApplied ? "border-primary" : "",
            )}
          >
            <MoreFilters
              filterOptions={filterOptions}
              filterActive={isFilterApplied}
              isAdmin={adminMode}
            />
            {isFilterApplied && (
              <Button
                type="button"
                variant="ghost"
                className="border-l text-red-800"
                onClick={onClearAll}
              >
                <XCircle />
              </Button>
            )}
          </div>

          <SortBySelect value={sortValue} onChange={onSortChange} removeBrand={onlyOneBrand}/>
        </div>
      </div>
    );
  }

  // Desktop layouts
  if (adminMode) {
    return (
      <div className={clsx("flex items-center justify-between gap-2")}>
        <div className="flex h-full items-center justify-center gap-4">
          <div className="text-muted-foreground shrink-0 text-xs">
            Quick Filters :
          </div>

          <MoreFilters
            filterOptions={filterOptions}
            filterActive={isFilterApplied}
            isAdmin={adminMode}
          />
          {isFilterApplied && (
            <Button
              type="button"
              variant="secondary"
              className="text-red-800"
              onClick={onClearAll}
            >
              <XCircle /> Clear
            </Button>
          )}
        </div>

        <SortBySelect
          value={sortValue}
          onChange={onSortChange}
          removeBrand={onlyOneBrand}
        />
      </div>
    );
  }

  // Desktop non-admin
  return (
    <div className="flex flex-col gap-2">
      <div
        className={clsx(
          "grid w-full grid-cols-[auto_1fr_auto_auto] items-center justify-start gap-4",
        )}
      >
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          Filter by :
        </span>

        <div className="flex h-full w-auto items-start justify-start gap-3">
          <MoreFilters
            filterOptions={filterOptions}
            filterActive={isFilterApplied}
            isAdmin={adminMode}
          />
          {isFilterApplied && (
            <Button
              type="button"
              size={"sm"}
              variant="ghost"
              className="text-red-800"
              onClick={onClearAll}
            >
              <XCircle />
            </Button>
          )}
        </div>

        <SortBySelect
          value={sortValue}
          onChange={onSortChange}
          removeBrand={onlyOneBrand}
        />
      </div>
    </div>
  );
}

export default function ResponsiveProductFilters({
  isAdmin,
  filterOptions,
  brandId,
}: Props) {
  const isMobile = useIsMobile();
  const router = useSafeRouter();
  const searchParams = useSearchParams();

  const brandIdValue = searchParams.get("brandId") || "";
  const effectiveBrandId = brandIdValue || brandId || "";

  const scopedBrands = useMemo(() => {
    const selectedBrandIds = effectiveBrandId.split(",").filter(Boolean);
    if (selectedBrandIds.length === 0) {
      return filterOptions.brands;
    }

    return filterOptions.brands.filter((b) => selectedBrandIds.includes(b.id));
  }, [effectiveBrandId, filterOptions.brands]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(scopedBrands.flatMap((b) => b.categories)),
    ).sort();
  }, [scopedBrands]);

  const vehicleCompanies = useMemo(() => {
    return Array.from(
      new Set(scopedBrands.flatMap((b) => b.vehicleCompanies || [])),
    ).sort();
  }, [scopedBrands]);

  const derivedFilterOptions = useMemo(
    () => ({
      ...filterOptions,
      vehicleCompanies,
      categories,
    }),
    [categories, filterOptions, vehicleCompanies],
  );

  const statusValue = searchParams.get("status") || "";
  const categoryValue = searchParams.get("category") || "";
  const vehicleCompanyValue = searchParams.get("vehicleCompany") || "";
  const priceValue = searchParams.get("price") || "";
  const discountValue = searchParams.get("discount") || "";
  const sortValue = searchParams.get("sort") || "";

  const onlyOnebRandSelected =
    effectiveBrandId.split(",").filter(Boolean).length === 1;

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

  const replaceParams = useCallback(
    (
      updater: (sp: URLSearchParams) => void,
      opts?: { resetPage?: boolean },
    ) => {
      const sp = new URLSearchParams(searchParams.toString());
      updater(sp);
      if (opts?.resetPage) sp.set("page", "1");
      router.replace(`/products-list?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const onSortChange = useCallback(
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

  const onClearAll = useCallback(() => {
    router.replace(`/products-list?page=1`, { scroll: false });
  }, [router]);

  return (
    <FilterRow
      filterOptions={derivedFilterOptions}
      isFilterApplied={isFilterApplied}
      sortValue={sortValue}
      onClearAll={onClearAll}
      onSortChange={onSortChange}
      adminMode={isAdmin}
      mobileMode={isMobile}
      onlyOneBrand={onlyOnebRandSelected}
    />
  );
}
