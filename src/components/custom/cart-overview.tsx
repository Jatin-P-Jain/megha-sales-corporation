"use client";

import React from "react";
import { Button } from "../ui/button";
import { ShoppingCartIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useCartState } from "@/context/cartContext";
import { SafeLink } from "./utility/SafeLink";

export default function CartOverview() {
  const { loading, cartTotals } = useCartState();

  const { totalUnits = 0, totalItems = 0 } = cartTotals || {};

  if (loading) {
    return (
      <div className="grid grid-cols-[3fr_4fr_2fr] items-center justify-center rounded-lg border p-1 text-sm md:px-4">
        <Skeleton className="mx-auto flex h-full w-3/4 justify-center" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border p-1 text-sm md:px-4">
      <div className="flex w-full flex-col items-start justify-between px-2">
        {totalUnits > 0 ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs md:text-sm">
                Products:{" "}
                <span className="text-primary text-sm font-semibold md:text-base">
                  {totalItems}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                Units:{" "}
                <span className="text-primary text-sm font-semibold tabular-nums md:text-base">
                  {totalUnits}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-col items-start text-xs font-medium">
            Empty Cart!
            <span className="text-muted-foreground text-[10px] font-normal">
              Add products to see totals.
            </span>
          </div>
        )}
      </div>

      {totalUnits === 0 ? (
        <Button
          className="flex cursor-not-allowed items-center justify-center"
          disabled
          type="button"
        >
          <span>Cart</span>
          <ShoppingCartIcon className="size-5" />
        </Button>
      ) : (
        <Button asChild className="flex w-auto items-center justify-center">
          <SafeLink href="/cart" className="flex items-center gap-2">
            <span>Cart</span>
            <ShoppingCartIcon className="size-5" fill="#fff" fillOpacity={0.5}/>
          </SafeLink>
        </Button>
      )}
    </div>
  );
}
