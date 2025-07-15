"use client";
import React from "react";
import clsx from "clsx";
import StatusChips from "./status-selection-chips";
import useIsMobile from "@/hooks/useIsMobile";
import CategoryFilter from "./category-filter";
import MoreFilters from "./more-filters";
import CartOverview from "./cart-overview";
import SearchPartNumber from "./search-part-number";

const ResponsiveProductFilters: React.FC<{
  isAdmin: boolean;
  isUser: boolean;
  categories: string[];
  brandId?: string;
}> = ({ isAdmin, isUser, categories, brandId }) => {
  const isMobile = useIsMobile();
  const newSearchParams = new URLSearchParams();

  if (brandId) {
    newSearchParams.set("brandId", brandId);
  }

  return (
    <>
      {isMobile &&
        (isAdmin ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="mx-auto w-full">
              <StatusChips />
            </div>
            <div
              className={clsx(
                "grid w-full min-w-0 grid-cols-[4fr_1fr_1fr] gap-2 pb-3",
                !isUser && "!grid-cols-1",
                !isAdmin && "grid-cols-[1fr_8fr]",
              )}
            >
              <CategoryFilter categories={categories} />
              <MoreFilters />
              <SearchPartNumber
                buttonClassName="text-primary font-semibold"
                showText={false}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 pb-4">
              <div className="grid grid-cols-[8fr_1fr] gap-4">
                <CategoryFilter categories={categories} />
                <MoreFilters />
              </div>
              {isUser ? <CartOverview isUser /> : <></>}
            </div>
          </>
        ))}
      {!isMobile &&
        (isAdmin ? (
          <div className="grid grid-cols-[8fr_3fr_1fr_1fr] gap-2 pb-4">
            <div className="overflow-x-auto">
              <StatusChips />
            </div>
            <CategoryFilter categories={categories} />
            <MoreFilters />
            <SearchPartNumber buttonClassName="text-primary font-semibold" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <div className="grid grid-cols-[8fr_3fr_1fr] gap-4">
              <div className="w-full">
                <CategoryFilter categories={categories} />
              </div>
              <SearchPartNumber buttonClassName="text-primary font-semibold" />
              <MoreFilters />
            </div>
            {isUser ? <CartOverview isUser /> : <></>}
          </div>
        ))}
    </>
  );
};

export default ResponsiveProductFilters;
