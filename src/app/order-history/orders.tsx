"use client";

import OrderDetails from "@/components/custom/order-details";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Order } from "@/types/order";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Orders({
  orderData,
  isAdmin,
}: {
  orderData: Order[];
  isAdmin: boolean;
}) {
  const params = useSearchParams();
  const requestedOrderId = params.get("orderId") ?? "";

  // 1) initialize from the URL
  const [orderFocused, setOrderFocused] = useState(requestedOrderId);

  // 2) whenever the URL param changes, re-sync our local state
  useEffect(() => {
    setOrderFocused(requestedOrderId);
  }, [requestedOrderId]);
  return (
    <div className="flex w-full flex-1 flex-grow flex-col gap-3">
      {orderData.map((order) => {
        const { id, products, status, totals, createdAt, updatedAt, user } =
          order;
        const { name: userName, email: userEmail, phone: userPhone } = user;
        return (
          <Card
            key={order?.id}
            className="relative gap-0 overflow-hidden py-3 shadow-md"
          >
            <CardContent className="flex flex-col gap-3 px-4 text-sm md:text-base">
              <div className="text-muted-foreground flex w-full items-center justify-between text-xs md:text-sm">
                Order ID:
                <span className="text-sm font-semibold text-black md:text-base">
                  {id}
                </span>
              </div>
              <div className="text-muted-foreground flex w-full items-center justify-between text-xs md:text-sm">
                Status:
                <span
                  className={clsx(
                    "rounded-full border-1 px-4 text-sm font-semibold md:text-base",
                    status === "pending" &&
                      "border-amber-600 bg-amber-100 text-yellow-600",
                    status === "packing" &&
                      "border-sky-700 bg-sky-100 text-sky-700",
                    status === "complete" &&
                      "border-green-700 bg-green-100 text-green-700",
                  )}
                >
                  {status.charAt(0).toUpperCase() +
                    status.slice(1, status.length)}
                </span>
              </div>
              <OrderDetails
                orderId={id}
                products={products}
                totals={totals}
                orderFocused={orderFocused}
                setOrderFocused={setOrderFocused}
              />
              <div className="flex w-full items-end justify-between gap-2">
                <div className="flex w-full flex-col items-center justify-start gap-1">
                  <div className="text-muted-foreground flex w-full items-center justify-start text-[10px] md:text-xs">
                    Created: {formatDateTime(createdAt)}
                  </div>
                  <div className="text-muted-foreground flex w-full items-center justify-start text-[10px] md:text-xs">
                    Updated: {formatDateTime(updatedAt)}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex w-full flex-col rounded-lg border-1 p-1 px-2 text-[10px]">
                    <span className="text-muted-foreground text-[8px] font-extralight">
                      Order By :
                    </span>
                    <div className="">{userName}</div>
                    <div>{userEmail}</div>
                    <div className="font-semibold">
                      {userPhone?.slice(3, userPhone.length)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-[3fr_1fr] items-end justify-center gap-4">
              <div className="flex w-full flex-col items-start justify-start md:flex-row md:justify-between"></div>
              <div className="flex w-full items-center justify-end gap-2"></div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
