"use client";
import React, { useState } from "react";
import clsx from "clsx";
import StatusChips from "./status-selection-chips";
import useIsMobile from "@/hooks/useIsMobile";
import CategoryFilter from "./category-filter";
import MoreFilters from "./more-filters";
import CartOverview from "./cart-overview";
import SearchPartNumber from "./search-part-number";
import StatusSelect from "./status-filter";
import { Button } from "../ui/button";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const ResponsiveProductFilters: React.FC<{
  isAdmin: boolean;
  isUser: boolean;
  categories: string[];
  brandId?: string;
}> = ({ isAdmin, isUser, categories, brandId }) => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [statusFiltersApplied, setStatusFiltersApplied] = useState(false);
  const [categoryFiltersApplied, setCategoryFiltersApplied] = useState(false);
  const newSearchParams = new URLSearchParams();

  if (brandId) {
    newSearchParams.set("brandId", brandId);
  }

  return (
    <>
      {isMobile &&
        (isAdmin ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="mx-auto flex w-full flex-col gap-2 pb-2">
              <div className="grid w-full grid-cols-[2fr_14fr_1fr] items-center justify-center gap-2">
                <span className="text-muted-foreground w-full text-xs">
                  Filters :
                </span>
                <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                  <StatusSelect
                    handleFiltersApplied={setStatusFiltersApplied}
                  />
                </div>
                <MoreFilters showText={false} />
              </div>
              <SearchPartNumber buttonClassName="text-primary font-semibold" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1 pb-4">
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
          <div
            className={clsx(
              "pb-4 inline-grid w-fit max-w-full grid-cols-[max-content_fit-content(40ch)_fit-content(40ch)_max-content] items-center gap-2",
              (statusFiltersApplied || categoryFiltersApplied) &&
                "grid-cols-[max-content_fit-content(40ch)_fit-content(40ch)_max-content_max-content]",
            )}
          >
            <div className="text-muted-foreground shrink-0 text-xs">
              Quick Filters :
            </div>
            <div className={clsx("w-fit max-w-[100%] min-w-0 shrink-0")}>
              <StatusSelect handleFiltersApplied={setStatusFiltersApplied} />
            </div>
            <div className={clsx("w-fit max-w-[100%] min-w-0 shrink-0")}>
              <CategoryFilter
                categories={categories}
                handleFiltersApplied={setCategoryFiltersApplied}
              />
            </div>
            {(statusFiltersApplied || categoryFiltersApplied) && (
              <Button
                variant={"secondary"}
                size={"icon"}
                className=""
                onClick={() => {
                  setCategoryFiltersApplied(false);
                  setStatusFiltersApplied(false);
                  router.push(`/products-list?brandId=${brandId}&page=1`);
                }}
              >
                <XCircle />
              </Button>
            )}
            <MoreFilters />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <div className="grid grid-cols-[8fr_3fr_1fr] gap-4">
              <div className="w-full">
                <SearchPartNumber buttonClassName="text-primary font-semibold" />
              </div>
              <CategoryFilter categories={categories} />
              <MoreFilters />
            </div>
            {isUser ? <CartOverview isUser /> : <></>}
          </div>
        ))}
    </>
  );
};

export default ResponsiveProductFilters;
