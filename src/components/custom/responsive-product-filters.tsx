"use client";
import React from "react";
import clsx from "clsx";
import useIsMobile from "@/hooks/useIsMobile";
import CategoryFilter from "./category-filter";
import MoreFilters from "./more-filters";
import CartOverview from "./cart-overview";
import SearchPartNumber from "./search-part-number";
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
  let categories: string[] = [];
  if (brandId) {
    const brandIds = brandId.split(",").filter((v) => v);
    const brandArr = filterOptions.brands.filter((brand) =>
      brandIds.includes(brand.id),
    );

    if (brandArr.length > 0) {
      categories = brandArr.map((b) => b.categories).flat();
    }
  } else {
    categories = filterOptions?.brands.map((b) => b.categories).flat();
  }
  categories = Array.from(new Set(categories)).sort();

  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandIdValue = searchParams.get("brandId") || "";
  const statusValue = searchParams.get("status") || "";
  const categoryValue = searchParams.get("category") || "";
  const vehicleCompanyValue = searchParams.get("vehicleCompany") || "";
  const priceValue = searchParams.get("price") || "";
  const discountValue = searchParams.get("discount") || "";
  const sortValue = searchParams.get("sort") || "";

  const isFilterApplied =
    brandIdValue.split(",").filter((b) => b).length > 1 ||
    statusValue ||
    categoryValue ||
    vehicleCompanyValue ||
    priceValue ||
    discountValue
      ? true
      : false;

  const params = new URLSearchParams(Array.from(searchParams.entries()));
  const applySorting = (newValue: string) => {
    params.set("sort", newValue);
    params.set("page", "1");
    router.push(`/products-list?${params.toString()}`);
  };

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
                    variant={"secondary"}
                    className="text-red-800"
                    onClick={() => {
                      router.push(`/products-list?page=1`);
                    }}
                  >
                    <XCircle />
                  </Button>
                )}
                <SortBySelect value={sortValue} onChange={applySorting} />
              </div>
              <SearchPartNumber buttonClassName="text-primary font-semibold" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1 pb-2">
              <div className="grid w-full grid-cols-[fit-content(3ch)_fit-content(30ch)_max-content_max-content_fit-content(5ch)] items-center gap-2">
                <span className="text-muted-foreground text-xs text-wrap">
                  Filter by :
                </span>
                <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                  <CategoryFilter categories={categories} />
                </div>
                <div className="flex h-full items-center justify-center gap-2">
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
                    variant={"secondary"}
                    className="text-red-800"
                    onClick={() => {
                      router.push(`/products-list?page=1`);
                    }}
                  >
                    <XCircle />
                  </Button>
                )}
                <SortBySelect value={sortValue} onChange={applySorting} />
              </div>
              {isUser ? <CartOverview isUser /> : <></>}
            </div>
          </>
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
            <div className={clsx("w-fit max-w-[100%] min-w-0 shrink-0")}>
              <StatusSelect />
            </div>
            <div className={clsx("w-fit max-w-[100%] min-w-0 shrink-0")}>
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
                variant={"secondary"}
                className="text-red-800"
                onClick={() => {
                  router.push(`/products-list?page=1`);
                }}
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
              <div className="flex w-full max-w-full min-w-0 flex-grow">
                <SearchPartNumber buttonClassName="text-primary font-medium w-full" />
              </div>
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
                  variant={"secondary"}
                  className="text-red-800"
                  onClick={() => {
                    router.push(`/products-list?page=1`);
                  }}
                >
                  <XCircle /> Clear
                </Button>
              )}
              <SortBySelect value={sortValue} onChange={applySorting} />
            </div>
            {isUser ? <CartOverview isUser /> : <></>}
          </div>
        ))}
    </>
  );
};

export default ResponsiveProductFilters;
