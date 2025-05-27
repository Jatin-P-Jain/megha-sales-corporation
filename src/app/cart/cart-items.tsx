"use client";

import React from "react";
import { useCart } from "@/context/cartContext";
import { Product } from "@/types/product";
import CartControls from "@/components/custom/cart-controls";
import currencyFormatter from "@/lib/currency-formatter";
import ProductImage from "@/components/custom/product-image";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { XCircleIcon } from "lucide-react";

export function CartItems({ items }: { items: Product[] }) {
  const { cart, loading } = useCart();

  if (loading) {
    return <div>Loading your cart…</div>;
  }

  // 1) Merge products + quantities
  const itemsWithQty = items
    .map((prod) => {
      const match = cart.find((c) => c.productId === prod.id);
      return {
        ...prod,
        quantity: match?.quantity ?? 0,
      };
    })
    // 2) only show items that actually have qty > 0
    .filter((prod) => prod.quantity > 0);

  if (itemsWithQty.length === 0) {
    return <div>Your cart is empty.</div>;
  }

  return (
    <ul className="mx-auto flex h-full flex-1 flex-col gap-4 pb-4">
      {itemsWithQty.map((item) => {
        const discountedPrice = Math.ceil(item.price * (item.discount / 100));
        const afterGstPrice = Math.ceil(item.price * (item.gst / 100));
        const totalPrice = currencyFormatter(
          Math.ceil(
            item.quantity * (item.price - discountedPrice + afterGstPrice),
          ),
        );
        return (
          <li
            key={item.id}
            className="grid grid-cols-1 gap-2 rounded-lg border p-2 px-4 shadow-md"
          >
            <div className="flex flex-col items-start justify-start gap-1">
              <div className="flex w-full items-center justify-between gap-2">
                <h3 className="line-clamp-1 w-full font-semibold">
                  {item.partName}
                </h3>
                <div className="bg-muted rounded-sm p-1">
                  <XCircleIcon className="size-4 text-red-700" />
                </div>
              </div>
              <Separator />
            </div>
            <div className="grid grid-cols-[1fr_2fr] items-start justify-start gap-2">
              <div className="flex h-full w-full flex-col items-start justify-between gap-2">
                <div className="flex h-[50%] w-full items-start justify-start gap-2">
                  <ProductImage productImage={item?.image} />
                </div>
                <h3 className="line-clamp-1 flex w-full justify-center font-semibold">
                  [{item.partNumber}]
                </h3>
                <Button
                  variant="link"
                  className="h-0 min-h-0 w-full p-0 py-1 pb-3 text-xs"
                >
                  Part Details
                </Button>
              </div>
              <div className="flex w-full flex-col items-end gap-1 text-sm">
                <div className="flex w-full items-center justify-between text-xs">
                  Units : <span className="font-medium">{item.quantity}</span>
                </div>
                <div className="flex w-full items-center justify-between gap-2 text-xs">
                  <span>Price (/unit) :</span>
                  <span className="text-sm font-semibold">
                    {currencyFormatter(item.price)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between text-xs">
                  Discount ({item.discount} %) :
                  <span className="font-semibold">
                    <span className="text-muted-foreground text-xs font-normal">
                      {"(-) "}
                    </span>
                    {currencyFormatter(discountedPrice)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between text-xs">
                  GST ({item.gst} %) :{" "}
                  <span className="font-semibold">
                    <span className="text-muted-foreground text-xs font-normal">
                      {"(+) "}
                    </span>
                    {currencyFormatter(afterGstPrice)}{" "}
                  </span>
                </div>
                <Separator />
                <div className="flex w-full items-center justify-between text-xs">
                  Amount :{" "}
                  <span className="text-primary text-sm font-semibold">
                    {totalPrice}
                  </span>
                </div>
                <div className="flex h-full items-end justify-end bg-amber-600">
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
