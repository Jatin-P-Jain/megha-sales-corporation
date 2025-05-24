"use client";
import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import CategoryChips from "./category-selection-chips";
import Link from "next/link";
import useIsMobile from "@/hooks/useIsMobile";
import StatusFilter from "./status-filter";
import MoreFilters from "./more-filters";
import CartOverview from "./cart-overview";
import { useAuth } from "@/context/useAuth";

const ResponsiveProductFilters: React.FC<{ isAdmin: boolean }> = ({
  isAdmin,
}) => {
  const isMobile = useIsMobile();
  const auth = useAuth();
  const isUser = auth?.currentUser ? true : false;
  return (
    <>
      {isMobile && (
        <div className="flex flex-col gap-2">
          <CategoryChips />
          <div
            className={clsx(
              "grid w-full min-w-0 grid-cols-[1fr_2fr_3fr] gap-2 pb-3",
              !isUser && "!grid-cols-1",
              !isAdmin && "grid-cols-[1fr_8fr]",
            )}
          >
            <MoreFilters />
            {isAdmin ? (
              <>
                <StatusFilter isAdmin />
                <Button className="w-full min-w-0" asChild>
                  <Link
                    href={"/admin-dashboard/new-product"}
                    className="min-w-0"
                  >
                    <PlusCircleIcon className="" />
                    Add Product
                  </Link>
                </Button>
              </>
            ) : isUser ? (
              <CartOverview isUser />
            ) : (
              <></>
            )}
          </div>
        </div>
      )}
      {!isMobile &&
        (isAdmin ? (
          <div className="grid grid-cols-[8fr_1fr_3fr_2fr] gap-2 pb-4">
            <div className="overflow-x-auto">
              <CategoryChips />
            </div>
            <MoreFilters />
            <StatusFilter isAdmin />
            <Button className="w-full" asChild>
              <Link href={"/admin-dashboard/new-product"}>
                <PlusCircleIcon className="" />
                Add New Product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <div className="grid grid-cols-[8fr_1fr] gap-4">
              <div className="mr-auto overflow-x-auto">
                <CategoryChips />
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
