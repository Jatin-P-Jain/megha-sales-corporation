"use client";

import React from "react";
import { Button } from "../ui/button";
import { ArrowBigRightDashIcon } from "lucide-react";
import currencyFormatter from "@/lib/currency-formatter";
import { useCartState } from "@/context/cartContext";
import { SafeLink } from "./utility/SafeLink";
import { useSafeRouter } from "@/hooks/useSafeRouter";

function CartSummary({ isUser }: { isUser: boolean }) {
  const router = useSafeRouter();
  const { cartTotals, loading } = useCartState();

  const { totalUnits = 0, totalItems = 0, totalAmount = 0 } = cartTotals || {};

  if (!isUser) return null;

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
                {loading ? "…" : totalUnits}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs md:text-sm">
              Items:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {loading ? "…" : totalItems}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-start gap-0 text-xs md:text-sm">
            <div className="flex items-center gap-1">
              Amount:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {loading ? "…" : currencyFormatter(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading || totalAmount === 0 ? (
        <Button
          className="flex w-full items-center justify-center"
          onClick={() => router.push("/checkout")}
          disabled
        >
          <span>Checkout</span>
          <ArrowBigRightDashIcon className="size-5" />
        </Button>
      ) : (
        <Button asChild className="flex w-full items-center justify-center">
          <SafeLink
            href="/checkout"
            className="flex w-full items-center justify-center gap-2"
          >
            <span>Checkout</span>
            <ArrowBigRightDashIcon className="size-5" />
          </SafeLink>
        </Button>
      )}
    </div>
  );
}

export default CartSummary;
