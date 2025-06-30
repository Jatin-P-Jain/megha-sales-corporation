"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/cartContext";
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
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { truncateMiddle } from "@/lib/utils";
import clsx from "clsx";
import useIsMobile from "@/hooks/useIsMobile";

export function CheckoutItems() {
  const { loading, cartTotals, cartProducts } = useCart();
  const isMobile = useIsMobile();
  const [showEmpty, setShowEmpty] = useState(false);

  const { totalNetAmount, totalUnits } = cartTotals;

  // Debounce the “empty” message
  useEffect(() => {
    if (cartProducts.length > 0) {
      setShowEmpty(false);
      return;
    }
    const t = setTimeout(() => setShowEmpty(true), 1000);
    return () => clearTimeout(t);
  }, [cartProducts.length]);

  if (loading || (cartProducts.length === 0 && !showEmpty)) {
    return (
      <div className="flex w-full items-center justify-center">
        <Loader2Icon className="size-5 animate-spin" />
      </div>
    );
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
    
      <div className="flex h-full flex-col rounded-lg border shadow-sm">
        {/* 1) Header table */}
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-muted-foreground mr-4">
                Part Details
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

        {/* 2) Scrollable body */}
        <ScrollArea className="max-h-[400px] min-h-[200px] overflow-auto">
          <Table className="table-fixed">
            <TableBody className="child:border-b-on-last-row">
              {cartProducts.map((item) => {
                const {
                  price = 0,
                  discount = 0,
                  gst = 0,
                } = item.productPricing ?? {};
                const qty = item.quantity;
                const unitDiscount = Math.round((discount / 100) * price);
                const unitPriceAfterDiscount = Math.round(price - unitDiscount);
                const unitGST = Math.round(
                  (gst / 100) * unitPriceAfterDiscount,
                );
                const unitNetPrice = Math.round(
                  unitPriceAfterDiscount + unitGST,
                );
                const totalPrice = Math.round(unitNetPrice * qty);
                return (
                  <TableRow key={item.cartItemKey} className={clsx("")}>
                    <TableCell>
                      <div className="flex flex-col items-start justify-start gap-1">
                        <div className="flex w-full items-center justify-start gap-1">
                          {isMobile
                            ? truncateMiddle(item.product?.partName, 16, 3, 10)
                            : item?.product?.partName}{" "}
                          {item.selectedSize && (
                            <span className="text-muted-foreground text-xs">
                              ({item.selectedSize})
                            </span>
                          )}
                        </div>
                        <div className="flex w-full">
                          <span className="text-muted-foreground text-xs">
                            {item?.product?.brandName}
                            {" - "}
                            {item?.product?.partNumber}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
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

        {/* 3) Footer table */}
        <Table className="table-fixed">
          <TableFooter className="bg-muted">
            <TableRow>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">{totalUnits}</TableHead>
              <TableHead className="text-right">
                {currencyFormatter(totalNetAmount)}
              </TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    
  );
}
