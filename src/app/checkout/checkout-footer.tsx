"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, ThumbsUpIcon } from "lucide-react";
import { useCart } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";

export default function CheckoutFooter() {
  const { cart, loading } = useCart();
  const [hasMounted, setHasMounted] = useState(false);

  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 4) debounce the empty-cart state
  const [showEmpty, setShowEmpty] = useState(false);
  useEffect(() => {
    if (cart.length > 0) {
      // if we have items, immediately hide “empty”
      setShowEmpty(false);
      return;
    }
    // if no items, wait 200 ms before showing empty
    const t = setTimeout(() => {
      setShowEmpty(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cart.length]);

  const totalAmount = cart.reduce((sum, i) => {
    const { price = 0, discount = 0, gst = 0 } = i.productPricing ?? {};
    const afterDisc = price * (1 - discount / 100);
    const withGst = afterDisc * (1 + gst / 100);
    return sum + withGst * i.quantity;
  }, 0);

  const isValueAbsent =
    !hasMounted || loading || (cart.length === 0 && !showEmpty);
  return (
    <div className="flex w-full items-center justify-between py-4">
      <p className="text-muted-foreground flex flex-col text-xs md:text-sm">
        Total Amount Payable:{"   "}
        {!isValueAbsent ? (
          <span className="text-primary text-base font-semibold">
            {currencyFormatter(totalAmount)}/-
          </span>
        ) : (
          <Loader2Icon className="size-4 animate-spin" />
        )}
      </p>
      <Button>
        Confirm & Place Order
        <ThumbsUpIcon className="size-4" />
      </Button>
    </div>
  );
}
