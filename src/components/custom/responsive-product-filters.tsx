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
import { ArrowDown, XCircle } from "lucide-react";
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
            <div className="flex flex-col gap-1 pb-2">
              <div className="grid w-full grid-cols-[fit-content(3ch)_fit-content(30ch)_max-content_fit-content(5ch)] items-center gap-2">
                <span className="text-muted-foreground text-xs text-wrap">
                  Filter by :
                </span>
                <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                  <CategoryFilter categories={categories} />
                </div>
                <MoreFilters showText={false} />
                <div className="flex w-full flex-col items-center justify-center rounded-md border-1 px-2 text-xs shadow-sm text-nowrap">
                  Sort by :{" "}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">⬆️ A - Z</span>
                  </div>
                </div>
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
          <div className="flex flex-col gap-2 pb-2">
            <div className="grid w-full grid-cols-[minmax(min-content,1fr)_max-content_fit-content(40ch)_max-content_max-content] items-center justify-start gap-4">
              <div className="flex w-full max-w-full min-w-0 flex-grow">
                <SearchPartNumber buttonClassName="text-primary font-medium w-full" />
              </div>
              <span className="text-muted-foreground text-xs">Filter by :</span>
              <div className="w-fit max-w-[100%] min-w-0 shrink-0">
                <CategoryFilter categories={categories} />
              </div>
              <MoreFilters />
              <div className="flex items-center justify-center text-sm">
                Sort by : <span className="ml-2 font-semibold">⬆️ A - Z</span>
                <ArrowDown className="size-3" />
              </div>
            </div>
            {isUser ? <CartOverview isUser /> : <></>}
          </div>
        ))}
    </>
  );
};

export default ResponsiveProductFilters;
