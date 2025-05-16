"use client";
import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import {
  PlusCircleIcon,
  FunnelPlusIcon,
  ArrowBigRightDashIcon,
} from "lucide-react";
import CategoryChips from "./category-selection-chips";
import Link from "next/link";
import useIsMobile from "@/hooks/useIsMobile";

const ResponsiveProductFilters: React.FC<{ isAdmin: boolean }> = ({
  isAdmin,
}) => {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile && (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto">
            <CategoryChips />
          </div>
          <div className={clsx("grid grid-cols-[1fr_6fr] gap-2 pb-3")}>
            <Button variant={"outline"} className="h-full w-full">
              <FunnelPlusIcon />
            </Button>
            {isAdmin ? (
              <Button className="w-full" asChild>
                <Link href={"/admin-dashboard/new-product"}>
                  <PlusCircleIcon className="" />
                  Add New Product
                </Link>
              </Button>
            ) : (
              <div className="grid grid-cols-[4fr_1fr] items-center justify-center rounded-lg border-1 p-1 pl-2 text-sm">
                <div className="flex flex-col pr-4">
                  <div className="text-muted-foreground">Total Cart</div>
                  <div className="flex w-full justify-between">
                    <div>
                      Items:{" "}
                      <span className="text-primary font-semibold">17</span>
                    </div>
                    <div>
                      Amount:{" "}
                      <span className="text-primary font-semibold">
                        ₹1,50,000
                      </span>
                    </div>
                  </div>
                </div>
                <Button className="w-full">
                  Cart <ArrowBigRightDashIcon className="size-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {!isMobile &&
        (isAdmin ? (
          <div className="grid grid-cols-[7fr_1fr_2fr] gap-4 pb-4">
            <div className="overflow-x-auto">
              <CategoryChips />
            </div>
            <Button variant={"outline"} className="h-full w-full">
              <FunnelPlusIcon />
            </Button>
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
              <div className="overflow-x-auto">
                <CategoryChips />
              </div>
              <Button variant={"outline"} className="h-full w-full">
                <FunnelPlusIcon />
              </Button>
            </div>
            <div className="grid grid-cols-[3fr_2fr] items-center justify-center gap-4 rounded-lg border-1 p-1 px-2">
              <div className="flex flex-col">
                <div className="text-muted-foreground">Total Cart</div>
                <div className="flex w-full justify-between">
                  <div>
                    Items:{" "}
                    <span className="text-primary font-semibold">17</span>
                  </div>
                  <div>
                    Amount:{" "}
                    <span className="text-primary font-semibold">
                      ₹1,50,000
                    </span>
                  </div>
                </div>
              </div>
              <Button className="w-full">
                Cart <ArrowBigRightDashIcon className="size-5" />
              </Button>
            </div>
          </div>
        ))}
      {/* <div className="flex flex-col gap-2 pb-4 md:grid md:grid-cols-1 md:gap-4">
        <div
          className={clsx(
            "grid w-full grid-cols-[1fr_8fr] items-center justify-between gap-2 md:grid-cols-[1fr_1fr]",
          )}
        >
          {isAdmin ? (
            <></>
          ) : (
           
          )}
        </div>
      </div> */}
    </>
  );
};

export default ResponsiveProductFilters;
