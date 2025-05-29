"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import currencyFormatter from "@/lib/currency-formatter";
import { CartProduct } from "@/types/cartProduct";
import clsx from "clsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CardContent } from "../ui/card";
import { Button } from "../ui/button";

export default function OrderDetails({
  orderId,
  products,
  totals,
  orderFocused,
  setOrderFocused,
}: {
  orderId: string;
  products: CartProduct[];
  totals: { items: number; units: number; amount: number };
  orderFocused: string;
  setOrderFocused: (orderId: string) => void;
}) {
  const { amount, units } = totals;
  const isOpen = orderId === orderFocused;

  return (
    <div className="text-primary flex w-full flex-col items-center justify-center text-sm font-semibold transition-all duration-700 ease-in-out md:text-base">
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => setOrderFocused(open ? orderId : "")}
        className="w-full"
      >
        <CardContent className="flex w-full flex-col p-0">
          <CollapsibleTrigger asChild>
            <Button
              className={clsx(
                "bg-muted text-primary flex w-full justify-between border-1 font-semibold",
                isOpen && "rounded-none rounded-t-lg",
              )}
            >
              <span>Order details</span>
              {isOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="flex w-full">
            {/* identical table markup here */}
            <div
              className={clsx(
                "pointer-events-none flex flex-col rounded-b-lg border shadow-sm transition-all duration-700 ease-in-out",
                !isOpen
                  ? "pointer-events-none h-0 opacity-0"
                  : "h-full opacity-100",
              )}
            >
              {/* 1) Header table */}
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="">
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
              <ScrollArea className="pointer-events-auto max-h-[200px] overflow-auto">
                <Table className="table-fixed">
                  <TableBody>
                    {products.map((item) => {
                      const { price = 0, discount = 0, gst = 0 } = item ?? {};
                      const afterDisc = price * (1 - discount / 100);
                      const withGst = afterDisc * (1 + gst / 100);
                      const lineTotal = Math.ceil(withGst * item.quantity);
                      return (
                        <TableRow
                          key={item.id}
                          className="font-normal text-black"
                        >
                          <TableCell>{item.id}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>

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
                <TableFooter>
                  <TableRow>
                    <TableHead className="text-primary font-semibold">
                      Total
                    </TableHead>
                    <TableHead className="text-primary text-right font-semibold">
                      {units}
                    </TableHead>
                    <TableHead className="text-primary text-right font-semibold">
                      {currencyFormatter(amount)}
                    </TableHead>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </div>
  );
}
