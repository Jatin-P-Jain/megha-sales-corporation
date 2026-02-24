"use client";

import React from "react";
import { Button } from "../ui/button";
import { ShoppingCartIcon } from "lucide-react";
import currencyFormatter from "@/lib/currency-formatter";
import { Skeleton } from "../ui/skeleton";
import clsx from "clsx";
import { useAuthState } from "@/context/useAuth";
import { useCartState } from "@/context/cartContext";
import Link from "next/link";

export default function CartOverview() {
  const { clientUser } = useAuthState();
  const { loading, cartTotals } = useCartState();

  const accountStatus = clientUser?.accountStatus;
  const isAccountApproved = accountStatus === "approved";

  const { totalUnits = 0, totalItems = 0, totalAmount = 0 } = cartTotals || {};

  if (loading) {
    return (
      <div className="grid grid-cols-[2fr_4fr_2fr] items-center justify-center rounded-lg border p-1 text-sm md:px-4">
        <div className="text-muted-foreground flex w-full flex-col text-xs md:text-sm">
          Cart Overview
          <span className="text-muted-foreground text-[8px]">
            (after discount &amp; GST)
          </span>
        </div>
        <Skeleton className="mx-auto flex h-full w-3/4 justify-center" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[2fr_4fr_2fr] items-center justify-center rounded-lg border p-1 text-sm md:px-4">
      <div className="text-muted-foreground flex w-full flex-col text-xs md:text-sm">
        Cart Overview
        <span className="text-muted-foreground text-[8px]">
          (after discount &amp; GST)
        </span>
      </div>
      <div className="mx-auto flex flex-col items-center justify-center md:w-fit">
        <div className="flex w-full flex-col justify-between gap-0 px-2 py-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1 text-xs md:text-sm">
              Units:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {totalUnits}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs md:text-sm">
              Items:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {totalItems}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-start gap-0 text-xs md:text-sm">
            <div className="flex items-center gap-1">
              Amount:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {currencyFormatter(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {!isAccountApproved ? (
        <Button
          className={clsx(
            "flex w-full items-center justify-center",
            "cursor-not-allowed ring-2 ring-yellow-700",
          )}
          disabled
          type="button"
        >
          <span>Cart</span>
          <ShoppingCartIcon className="size-5" />
        </Button>
      ) : (
        <Button asChild className="flex w-full items-center justify-center">
          <Link href="/cart" className="flex items-center gap-2">
            <span>Cart</span>
            <ShoppingCartIcon className="size-5" />
          </Link>
        </Button>
      )}
    </div>
  );
}
