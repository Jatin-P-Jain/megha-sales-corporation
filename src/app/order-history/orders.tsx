"use client";
import { OrderStatusDropdown } from "@/components/custom/order-status";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, getBaseUrl } from "@/lib/utils";
import { Order, OrderStatus } from "@/types/order";
import { updateOrderStatus } from "./actions";
import {
  notifyAdminsByRoleAction,
  notifyUserAction,
} from "@/actions/notify-user";
import { toast } from "sonner";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { ChevronsRight, Clock4, ClockCheck, Copy, History } from "lucide-react";
import currencyFormatter from "@/lib/currency-formatter";
import { useUserProfileState } from "@/context/UserProfileProvider";
import type { UserData } from "@/types/user";
import { UserRole } from "@/types/userGate";
import { useUserGate } from "@/context/UserGateProvider";

type UpdaterContextInput = Partial<UserData> & {
  userRole: UserRole | null;
};

const getStatusMessage = (orderId: string, status: string) => {
  const messages = {
    pending: `Your order #${orderId} is pending with us. We'll start processing it soon!`,
    packing: `Your order #${orderId} is being packed! Please wait for the next update.`,
    dispatch: `Your order #${orderId} has been disptached.`,
  };

  return (
    messages[status.toLowerCase() as keyof typeof messages] ||
    `Your order #${orderId} status has been updated to ${status}.`
  );
};

function toLabelCase(status: string) {
  if (!status) return "Updated";
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export const handleStatusChange = async (
  order: Order,
  newStatus: OrderStatus,
  isAdmin: boolean,
  updaterContext?: UpdaterContextInput,
) => {
  const updateResponse = await updateOrderStatus(
    order.id,
    newStatus,
    updaterContext,
  );
  if (updateResponse?.error) {
    toast.error("Error updating status of the order.");
    return { success: false };
  }
  if (isAdmin) {
    toast.success("Order Status Updated!", {
      description: `Order status changed to "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1, newStatus.length)}"`,
    });
  }

  const orderUrl = `${getBaseUrl()}/order-history/${order.id}`;

  const customerPushPromise = notifyUserAction({
    uid: order.user?.uid,
    type: "order",
    title: "📦 Order Update",
    body: getStatusMessage(order.id, newStatus),
    url: orderUrl,
    clickAction: "view_order",
    status: newStatus,
    pushOnly: true,
  });

  const staffPushPromise = notifyAdminsByRoleAction({
    type: "order",
    title: "📦 Order Status Updated",
    body: `Order #${order.id} moved to ${toLabelCase(newStatus)} by ${updaterContext?.displayName ?? "Admin"}.`,
    url: orderUrl,
    clickAction: "view_order",
    status: newStatus,
    pushOnly: true,
  });

  const notificationResults = await Promise.allSettled([
    customerPushPromise,
    staffPushPromise,
  ]);

  notificationResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Order update notification dispatch failed", result.reason);
    }
  });

  return { success: true };
};

export default function Orders({
  orderData,
  isAdmin,
}: {
  orderData: Order[];
  isAdmin: boolean;
}) {
  const router = useSafeRouter();
  const { clientUser } = useUserProfileState();
  const { userRole } = useUserGate();

  return (
    <div
      className={clsx(
        "flex w-full flex-col gap-3",
        orderData.length === 0 && "flex-1",
      )}
    >
      {orderData.map((order) => {
        const { id, status, totals, createdAt, updatedAt, user } = order;
        const {
          displayName: userName,
          email: userEmail,
          phone: userPhone,
          firmName,
        } = user;
        const orderValue = totals?.amount ?? 0;

        return (
          <Card key={order?.id} className={clsx("border py-3 shadow-md")}>
            <CardContent className="flex flex-col gap-2 px-4 text-sm md:text-base">
              <div className="flex items-center justify-between gap-3">
                <span className="w-full text-xs font-semibold md:text-sm">
                  {id}
                </span>

                <OrderStatusDropdown
                  isAdmin={isAdmin}
                  status={status}
                  onChange={async (newStatus) => {
                    const res = await handleStatusChange(
                      order,
                      newStatus,
                      isAdmin,
                      {
                        ...clientUser,
                        userRole,
                      },
                    );
                    if (res?.success) {
                      router.refresh();
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap justify-between gap-2 rounded-xl border bg-white p-2 px-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-semibold">{totals.items}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-muted-foreground">Units:</span>
                  <span className="font-semibold">{totals.units}</span>
                </div>
                <div className="flex gap-3 text-right">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-semibold">
                    {currencyFormatter(orderValue)}
                  </span>
                </div>
              </div>

              <Button
                variant={"default"}
                onClick={() => router.push(`/order-history/${order.id}`)}
                className={clsx(
                  "bg-muted text-primary flex w-full justify-between border font-semibold hover:bg-transparent",
                )}
              >
                <span>Order details</span>
                <ChevronsRight className="size-4" />
              </Button>

              <div className="flex w-full flex-col items-end justify-between gap-2">
                {!isAdmin && (
                  <div className="flex w-full items-center justify-between text-[10px] md:text-xs">
                    <div className="text-muted-foreground flex flex-col items-start">
                      Order Placed:
                      <span className="text-accent-foreground flex gap-0.5">
                        <ClockCheck className="inline size-3" />
                        <span className="font-medium">
                          {formatDateTime(createdAt)}
                        </span>
                      </span>
                    </div>
                    <div className="text-muted-foreground flex flex-col items-start">
                      Last Updated:
                      <span className="text-accent-foreground flex gap-0.5">
                        <History className="inline size-3" />
                        <span className="font-medium">
                          {formatDateTime(updatedAt)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="relative flex w-full flex-col gap-1 rounded-xl border bg-white p-2 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                        Order placed by:
                      </span>
                      <span className="text-muted-foreground absolute right-2 bottom-2 flex items-center gap-1">
                        <Clock4 className="inline size-3" />
                        {formatDateTime(updatedAt)}
                      </span>
                    </div>
                    <div className="text-primary flex items-center gap-1 text-xs font-medium">
                      <span className="font-semibold">
                        {firmName ?? userEmail}
                      </span>{" "}
                      ({userName})
                    </div>
                    <div
                      className="text-primary flex cursor-pointer items-center gap-1 text-xs font-medium"
                      onClick={() => {
                        navigator.clipboard.writeText(userPhone ?? "");
                      }}
                    >
                      +91- {userPhone} <Copy className="inline size-3" />
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
