"use client";

import OrderDetails from "@/components/custom/order-details";
import { OrderStatusDropdown } from "@/components/custom/order-status";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, getBaseUrl } from "@/lib/utils";
import { Order, OrderStatus } from "@/types/order";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { updateOrderStatus } from "./actions";
import { toast } from "sonner";

const getStatusMessage = (orderId: string, status: string) => {
  const messages = {
    pending: `Your order #${orderId} is pending with us. We'll start processing it soon!`,
    packing: `Your order #${orderId} is being packed! Please wait for the next update.`,
    complete: `Your order #${orderId} has been delivered and marked complete in our system.`,
  };

  return (
    messages[status.toLowerCase() as keyof typeof messages] ||
    `Your order #${orderId} status has been updated to ${status}.`
  );
};

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

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    const updateResponse = await updateOrderStatus(order.id, newStatus);
    if (updateResponse?.error) {
      toast.error("Error updating status of the order.");
      return;
    }
    if (isAdmin) {
      toast.success("Order Status Updated!", {
        description: `Order status changed to "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1, newStatus.length)}"`,
      });
    }

    await fetch("/api/notify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: order.user?.id,
        title: "🛒 Order Update",
        body: getStatusMessage(order.id, newStatus),
        url: `${getBaseUrl()}/order-history/${order.id}`,
        clickAction: "view_order",
        status: newStatus,
      }),
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
                  handleStatusChange(order, newStatus);
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
