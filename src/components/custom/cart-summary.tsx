"use client";

import React from "react";
import { Button } from "../ui/button";
import { ArrowBigRightDashIcon } from "lucide-react";
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
  const checkoutDisabledReason = !profileComplete
    ? "Complete your profile to proceed to checkout"
    : !isAccountApproved
      ? "Your account is pending approval"
      : null;

  if (!isUser) return null;

  return (
    <div className="grid w-full grid-cols-[1fr_2fr_2fr] items-center justify-end gap-1 rounded-lg border p-1 px-2 text-sm md:px-4">
      <div className="text-muted-foreground flex w-full flex-col text-xs md:text-sm">
        Cart Overview
      </div>

      <div className="mx-auto flex w-full flex-col items-center justify-center md:w-fit">
        <div className="flex w-full flex-col justify-between gap-0 px-2 py-0">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1 text-xs md:text-sm">
              Products:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {loading ? "…" : totalItems}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs md:text-sm">
              Units:{" "}
              <span className="text-primary text-sm font-semibold md:text-base">
                {loading ? "…" : totalUnits}
              </span>
            </div>
          </div>

          {canSeeDiscounts && (
            <div className="flex flex-col items-center justify-start gap-0 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                Amount:{" "}
                <span className="text-primary text-sm font-semibold md:text-base">
                  {loading ? "…" : currencyFormatter(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isCheckoutDisabled ? (
        <Button
          className="flex h-auto w-full items-center justify-center border border-amber-600"
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

      {checkoutDisabledReason && (
        <p className="col-span-3 text-right text-[10px] text-amber-600 md:text-xs">
          ⚠️ {checkoutDisabledReason}
        </p>
      )}
    </div>
  );
}

export default CartSummary;
