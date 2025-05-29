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

export function CheckoutItems() {
  const { cart, loading } = useCart();
  const [showEmpty, setShowEmpty] = useState(false);

  // Debounce the “empty” message
  useEffect(() => {
    if (cart.length > 0) {
      setShowEmpty(false);
      return;
    }
    const t = setTimeout(() => setShowEmpty(true), 1000);
    return () => clearTimeout(t);
  }, [cart.length]);

  if (loading || (cart.length === 0 && !showEmpty)) {
    return (
      <div className="flex w-full items-center justify-center">
        <Loader2Icon className="size-5 animate-spin" />
      </div>
    );
  }
  if (cart.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        Your cart is empty!
        <Button asChild>
          <Link href={"/products-list"}>Build your cart</Link>
        </Button>
      </div>
    );
  }

  // Totals
  const totalUnits = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = Math.ceil(
    cart.reduce((sum, i) => {
      const { price = 0, discount = 0, gst = 0 } = i.productPricing ?? {};
      const afterDisc = price * (1 - discount / 100);
      const withGst = afterDisc * (1 + gst / 100);
      return sum + withGst * i.quantity;
    }, 0),
  );

  return (
    <div className="flex h-full flex-col rounded-lg border shadow-sm">
      {/* 1) Header table */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="text-muted-foreground mr-4">
              Part Number
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
      <ScrollArea className="max-h-[400px] min-h-[250px] overflow-auto">
        <Table className="table-fixed">
          <TableBody>
            {cart.map((item) => {
              const {
                price = 0,
                discount = 0,
                gst = 0,
              } = item.productPricing ?? {};
              const afterDisc = price * (1 - discount / 100);
              const withGst = afterDisc * (1 + gst / 100);
              const lineTotal = Math.ceil(withGst * item.quantity);
              return (
                <TableRow key={item.productId} className="">
                  <TableCell>{item.productId}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {currencyFormatter(lineTotal)}
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
              {currencyFormatter(totalAmount)}
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
