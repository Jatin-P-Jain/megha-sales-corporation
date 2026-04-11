"use client";

import React from "react";
import { useCartState } from "@/context/cartContext"; // or "@/context/cart-context" (use your real path)
import currencyFormatter from "@/lib/currency-formatter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { ImageOffIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import Image from "next/image";
import imageUrlFormatter from "@/lib/image-urlFormatter";

export function CheckoutItems() {
  const { loading, cartTotals, cartProducts: products } = useCartState();
  const { totalAmount: amount, totalUnits: units = 0 } = cartTotals || {};

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center">
        <Loader2Icon className="size-5 animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        Your cart is empty!
        <Button asChild>
          <SafeLink href="/products-list">Build your cart</SafeLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border shadow-sm">
      <Table className="w-full table-fixed">
        <colgroup>
          <col className="w-[68%]" />
          <col className="w-[14%]" />
          <col className="w-[18%]" />
        </colgroup>
        <TableHeader className="">
          <TableRow className="text-xs">
            <TableHead className="text-muted-foreground">
              Product Details
            </TableHead>
            <TableHead className="text-muted-foreground text-right">
              Units
            </TableHead>
            <TableHead className="text-muted-foreground text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      <ScrollArea className="min-h-0 flex-1 overflow-auto">
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[68%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
          </colgroup>
          <TableBody className="bg-card">
            {products.map((item) => {
              const {
                price = 0,
                discount = 0,
                gst = 0,
              } = item.productPricing ?? {};
              const qty = item.quantity;
              const unitDiscount = Math.round((discount / 100) * price);
              const unitPriceAfterDiscount = Math.round(price - unitDiscount);
              const unitGST = Math.round((gst / 100) * unitPriceAfterDiscount);
              const unitNetPrice = Math.round(unitPriceAfterDiscount + unitGST);
              const totalPrice = Math.round(unitNetPrice * qty);
              const productImage =
                item.productImage ?? item.product?.image ?? undefined;

              return (
                <TableRow key={item.cartItemKey} className={clsx("")}>
                  <TableCell>
                    <div className="flex min-w-0 items-center justify-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white shadow-sm">
                        {productImage ? (
                          <Image
                            src={imageUrlFormatter(productImage)}
                            alt={item?.product?.partName ?? "Product image"}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center text-[10px]">
                            <ImageOffIcon className="h-4 w-4" />
                            <small>No Image</small>
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col items-start justify-start gap-0.5">
                        <span className="truncate font-semibold">
                          {item?.product?.partNumber}
                        </span>

                        <div className="flex w-full">
                          <span className="text-muted-foreground truncate text-xs">
                            <span className="font-medium">
                              {item?.product?.brandName}
                            </span>
                            {" - "}
                            {item?.product?.partName}
                          </span>
                        </div>
                        {item.selectedSize && (
                          <span className="text-muted-foreground text-xs">
                            ({item.selectedSize})
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {currencyFormatter(totalPrice)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <Table className="w-full table-fixed">
        <colgroup>
          <col className="w-[68%]" />
          <col className="w-[14%]" />
          <col className="w-[18%]" />
        </colgroup>
        <TableFooter className="font-medium">
          <TableRow>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">{units}</TableHead>
            <TableHead className="text-right">
              {currencyFormatter(amount)}
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
