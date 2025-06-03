"use client";
import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import StatusChips from "./status-selection-chips";
import Link from "next/link";
import useIsMobile from "@/hooks/useIsMobile";
import CategoryFilter from "./category-filter";
import MoreFilters from "./more-filters";
import CartOverview from "./cart-overview";

const ResponsiveProductFilters: React.FC<{
  isAdmin: boolean;
  isUser: boolean;
  categories: string[];
  brandId?: string;
}> = ({ isAdmin, isUser, categories, brandId }) => {
  const isMobile = useIsMobile();
  const newSearchParams = new URLSearchParams();
  console.log({ brandId });

  if (brandId) {
    newSearchParams.set("brandId", brandId);
  }
  console.log(newSearchParams.get("brandId"));

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
                "grid w-full min-w-0 grid-cols-[1fr_4fr_3fr] gap-2 pb-3",
                !isUser && "!grid-cols-1",
                !isAdmin && "grid-cols-[1fr_8fr]",
              )}
            >
              <MoreFilters />
              <CategoryFilter categories={categories} />
              <Button className="w-full min-w-0" asChild>
                <Link
                  href={`/admin-dashboard/new-product?${newSearchParams}`}
                  className="min-w-0"
                >
                  <PlusCircleIcon className="" />
                  Add Product
                </Link>
              </Button>
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
          <div className="grid grid-cols-[8fr_1fr_3fr_2fr] gap-2 pb-4">
            <div className="overflow-x-auto">
              <StatusChips />
            </div>
            <MoreFilters />

            <CategoryFilter categories={categories} />
            <Button className="w-full" asChild>
              <Link href={`/admin-dashboard/new-product?${newSearchParams}`}>
                <PlusCircleIcon className="" />
                Add New Product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <div className="grid grid-cols-[8fr_1fr] gap-4">
              <div className="w-full">
                <CategoryFilter categories={categories} />
              </div>
              <MoreFilters />
            </div>
            {isUser ? <CartOverview isUser /> : <></>}
          </div>
        ))}
    </>
  );
};

export default ResponsiveProductFilters;
