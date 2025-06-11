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
import useIsMobile from "@/hooks/useIsMobile";
import { truncateMiddle } from "@/lib/utils";

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
  const isMobile = useIsMobile();

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
                    {products.map((item) => {
                      const {
                        price = 0,
                        discount = 0,
                        gst = 0,
                      } = item.productPricing ?? {};
                      const qty = item.quantity;
                      const unitDiscount = Math.round((discount / 100) * price);
                      const unitPriceAfterDiscount = Math.round(
                        price - unitDiscount,
                      );
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
                                  ? truncateMiddle(
                                      item.product?.partName,
                                      16,
                                      3,
                                      10,
                                    )
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
                <TableFooter className="bg-muted font-semibold">
                  <TableRow>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right font-semibold">
                      {units}
                    </TableHead>
                    <TableHead className="text-right font-semibold">
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
