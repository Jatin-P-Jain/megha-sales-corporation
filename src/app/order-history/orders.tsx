"use client";

import OrderDetails from "@/components/custom/order-details";
import { OrderStatusDropdown } from "@/components/custom/order-status";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Order, OrderStatus } from "@/types/order";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { updateOrderStatus } from "./actions";
import { toast } from "sonner";

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

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    const updateResponse = await updateOrderStatus(orderId, newStatus);
    if (updateResponse?.error) {
      toast.error("Error updating status of the order.");
      return;
    }
    toast.success("Order Status Updated!", {
      description: `Order status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1, newStatus.length)}`,
    });
  };

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
              <OrderStatusDropdown
                isAdmin={isAdmin}
                status={status}
                onChange={(newStatus) => {
                  handleStatusChange(order.id, newStatus);
                }}
              />
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
          </Card>
        );
      })}
    </div>
  );
}
