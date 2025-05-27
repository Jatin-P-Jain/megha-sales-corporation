"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/cartContext";
import { Product } from "@/types/product";
import CartControls from "@/components/custom/cart-controls";
import currencyFormatter from "@/lib/currency-formatter";
import ProductImage from "@/components/custom/product-image";
import { Separator } from "@/components/ui/separator";
import { XCircleIcon } from "lucide-react";
import { PartDetailsDialog } from "@/components/custom/part-details-dialog";
import CartItemLoading from "./cart-item-loading";

export function CartItems({
  itemsPromise,
}: {
  itemsPromise: Promise<Product[]>;
}) {
  const { cart, loading, removeFromCart } = useCart();

  const [items, setItems] = useState<Product[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 2) load the Product[] from your promise
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await itemsPromise;
        if (active) {
          setItems(data);
          setItemsLoaded(true);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [itemsPromise]);

  // 3) merge + filter
  const itemsWithQty = items
    .map((p) => ({
      ...p,
      quantity: cart.find((c) => c.productId === p.id)?.quantity ?? 0,
    }))
    .filter((p) => p.quantity > 0);

  // 4) debounce the empty-cart state
  const [showEmpty, setShowEmpty] = useState(false);
  useEffect(() => {
    if (itemsWithQty.length > 0) {
      // if we have items, immediately hide “empty”
      setShowEmpty(false);
      return;
    }
    // if no items, wait 200 ms before showing empty
    const t = setTimeout(() => {
      setShowEmpty(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [itemsWithQty.length]);

  // 5) final render logic
  if (
    !hasMounted ||
    loading ||
    !itemsLoaded ||
    (itemsWithQty.length === 0 && !showEmpty)
  ) {
    return <CartItemLoading />;
  }
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
                    {currencyFormatter(discountedPrice)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between text-xs md:text-sm">
                  GST ({item.gst} %) :{" "}
                  <span className="text-sm font-semibold md:text-base">
                    <span className="text-muted-foreground text-xs font-normal">
                      {"(+) "}
                    </span>
                    {currencyFormatter(afterGstPrice)}{" "}
                  </span>
                </div>
                <Separator />
                <div className="flex w-full items-center justify-between text-xs md:text-sm">
                  Amount :{" "}
                  <span className="text-primary text-base font-semibold md:text-lg">
                    {totalPrice}
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
