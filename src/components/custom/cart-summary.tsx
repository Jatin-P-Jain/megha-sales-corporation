"use client";

import React from "react";
import { Button } from "../ui/button";
import { ArrowBigRightDashIcon, Loader2 } from "lucide-react";
import currencyFormatter from "@/lib/currency-formatter";
import { useCartState } from "@/context/cartContext";
import { SafeLink } from "./utility/SafeLink";
import { useUserGate } from "@/context/UserGateProvider";

function CartSummary({ isUser }: { isUser: boolean }) {
  const { cartTotals, loading } = useCartState();
  const { profileComplete, accountStatus } = useUserGate();
  const isAccountApproved = accountStatus === "approved";
  const canSeeDiscounts = profileComplete && isAccountApproved;

  const { totalUnits = 0, totalItems = 0, totalAmount = 0 } = cartTotals || {};

  const isCheckoutDisabled = !canSeeDiscounts || loading || totalAmount === 0;

  if (!isUser) return null;

  return (
    <div className="flex w-full items-start justify-between gap-3 rounded-lg border p-1 px-2 text-sm md:items-center md:px-4">
      <div className="flex w-fit flex-col items-start text-xs md:w-full md:flex-row md:items-center md:gap-4">
        <div className="flex w-full items-center justify-between gap-4 md:w-fit">
          <div className="flex items-center gap-1">
            Products:{" "}
            <span className="text-primary text-sm font-semibold md:text-base">
              {loading ? "…" : totalItems}
            </span>
          </div>
          <div className="flex items-center gap-1">
            Units:{" "}
            <span className="text-primary text-sm font-semibold md:text-base">
              {loading ? "…" : totalUnits}
            </span>
          </div>
        </div>
        {canSeeDiscounts && (
          <div className="flex w-full items-center gap-1">
            Total Amount:{" "}
            <span className="text-primary text-sm font-semibold whitespace-nowrap md:text-base">
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                currencyFormatter(totalAmount)
              )}
            </span>
          </div>
        )}
      </div>

      {isCheckoutDisabled ? (
        <Button
          className="flex h-auto items-center justify-center border border-amber-600"
          disabled
        >
          <span>Checkout</span>
          <ArrowBigRightDashIcon className="size-5" />
        </Button>
      ) : (
        <Button asChild className="flex items-center justify-center">
          <SafeLink
            href="/checkout"
            className="flex items-center justify-center gap-2"
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
