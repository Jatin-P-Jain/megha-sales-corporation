"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/cartContext";
import CartControls from "@/components/custom/cart-controls";
import currencyFormatter from "@/lib/currency-formatter";
import ProductImage from "@/components/custom/product-image";
import { Separator } from "@/components/ui/separator";
import { XCircleIcon } from "lucide-react";
import { PartDetailsDialog } from "@/components/custom/part-details-dialog";
import CartItemLoading from "./cart-item-loading";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CartItems() {
  const { cartProducts, loading, removeFromCart } = useCart();

  const [hasMounted, setHasMounted] = useState(false);

  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [showEmpty, setShowEmpty] = useState(false);
  useEffect(() => {
    if (cartProducts.length > 0) {
      // if we have items, immediately hide “empty”
      setShowEmpty(false);
      return;
    }
    // if no items, wait 200 ms before showing empty
    const t = setTimeout(() => {
      setShowEmpty(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cartProducts.length]);

  // 5) final render logic
  if (loading || !hasMounted || (cartProducts.length === 0 && !showEmpty)) {
    return <CartItemLoading />;
  }
  if (cartProducts.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        Your cart is empty!
        <Button asChild>
          <Link href={"/products-list"}>Build your cart</Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="mx-auto flex h-full flex-1 flex-col gap-4 pb-4">
      {cartProducts.map((item) => {
        const discountValue = Math.ceil(item.price * (item.discount / 100));
        const gstValue = Math.ceil(
          (item.price - discountValue) * (item.gst / 100),
        );
        const totalPrice = Math.ceil(
          item.quantity * (item.price - discountValue + gstValue),
        );
        return (
          <li
            key={item.id}
            className="grid grid-cols-1 gap-2 rounded-lg border p-2 px-4 shadow-md md:p-4 md:px-6"
          >
            <div className="flex flex-col items-start justify-start gap-1">
              <div className="flex w-full items-center justify-between gap-2">
                <h3 className="line-clamp-1 w-full text-sm font-semibold md:text-base">
                  {item.partName}
                </h3>
                <div
                  className="bg-muted rounded-sm p-1"
                  onClick={() => removeFromCart(item.id)}
                >
                  <XCircleIcon className="size-4 text-red-700 md:size-5" />
                </div>
              </div>
              <Separator />
            </div>
            <div className="grid grid-cols-[1fr_2fr] items-start justify-start gap-2">
              <div className="flex h-full w-full flex-col items-start justify-between gap-2">
                <div className="flex h-[50%] w-full items-start justify-start gap-2">
                  <ProductImage productImage={item?.image} />
                </div>
                <h3 className="line-clamp-1 flex w-full justify-center text-sm font-semibold md:text-base">
                  [{item.partNumber}]
                </h3>
                <PartDetailsDialog part={item} />
              </div>
              <div className="flex w-full flex-col items-end gap-1 text-sm md:text-base">
                <div className="flex w-full items-center justify-between text-xs md:text-sm">
                  Units :{" "}
                  <span className="text-sm font-medium md:text-base">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between gap-2 text-xs md:text-sm">
                  <span>Price (/unit) :</span>
                  <span className="text-sm font-semibold md:text-base">
                    {currencyFormatter(item.price)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between text-xs md:text-sm">
                  Discount ({item.discount} %) :
                  <span className="text-sm font-semibold md:text-base">
                    <span className="text-muted-foreground text-xs font-normal">
                      {"(-) "}
                    </span>
                    {currencyFormatter(discountValue)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between text-xs md:text-sm">
                  GST ({item.gst} %) :{" "}
                  <span className="text-sm font-semibold md:text-base">
                    <span className="text-muted-foreground text-xs font-normal">
                      {"(+) "}
                    </span>
                    {currencyFormatter(gstValue)}{" "}
                  </span>
                </div>
                <Separator />
                <div className="flex w-full items-center justify-between text-xs md:text-sm">
                  Amount :{" "}
                  <span className="text-primary text-base font-semibold md:text-lg">
                    {currencyFormatter(totalPrice)}
                  </span>
                </div>
                <div className="flex h-full items-end justify-end pt-4">
                  <CartControls productId={item.id} productPricing={{}} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
