"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/context/useAuth";
import clsx from "clsx";

function CartOverview({ isUser }: { isUser: boolean }) {
  const { clientUser } = useAuth();
  const accountStatus = clientUser?.accountStatus;
  const isAccountApproved = accountStatus === "approved";
  const router = useRouter();
  const { cart, loading, cartTotals } = useCart();
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
  const { totalUnits = 0, totalItems = 0, totalAmount = 0 } = cartTotals || {};

  const isLoading = !hasMounted || loading || !ready;


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
          className={clsx("flex w-full items-center justify-center", !isAccountApproved && "cursor-not-allowed ring-2 ring-yellow-700")}
          onClick={() => router.push("/cart")}
          disabled={isLoading || isAccountApproved === false}
        >
          <span>Cart</span>
          <ShoppingCartIcon className="size-5" />
        </Button>
      </div>
  );
}

export default CartOverview;
