"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";
import { Skeleton } from "../ui/skeleton";

function CartOverview({ isUser }: { isUser: boolean }) {
  const router = useRouter();
  const { cart, loading } = useCart();
  const [hasMounted, setHasMounted] = useState(false);
  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 4) debounce the empty-cart state
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cart.length]);

  const isLoading = !hasMounted || loading || !ready;

  // 1) total units = sum of all quantities
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 2) total distinct items = number of lines in the cart
  const totalItems = cart.length;

  // 3) total amount after discount & gst
  const totalAmount = Math.ceil(
    cart.reduce((sum, item) => {
      const { price = 0, discount = 0, gst = 0 } = item.productPricing ?? {};

      // 1) compute the price after % discount
      const afterDiscount = price * (1 - discount / 100);

      // 2) apply GST % on top of that
      const netPerUnit = afterDiscount * (1 + gst / 100);

      return sum + netPerUnit * item.quantity;
    }, 0),
  );

  if (!isUser) return null;

  return (
    <div className="grid grid-cols-[2fr_4fr_2fr] items-center justify-center rounded-lg border p-1 text-sm md:px-4">
      <div className="text-muted-foreground flex w-full flex-col text-xs md:text-sm">
        Cart Overview
        <span className="text-muted-foreground text-[8px]">
          {" "}
          (after discount & GST)
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="mx-auto flex h-full w-3/4 justify-center" />
      ) : (
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
      )}
      <Button
        className="flex w-full items-center justify-center"
        onClick={() => router.push("/cart")}
        disabled={isLoading}
      >
        <span>Cart</span>
        <ShoppingCartIcon className="size-5" />
      </Button>
    </div>
  );
}

export default CartOverview;
