"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, PackageCheck, PencilLineIcon } from "lucide-react";
import { useCartActions, useCartState } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";
import { createOrder } from "./actions";
import { useAuthState } from "@/context/useAuth";
import { toast } from "sonner";
import { Order } from "@/types/order";
import { getBaseUrl } from "@/lib/utils";
import {
  notifyUserAction,
  notifyAdminsByRoleAction,
} from "@/actions/notify-user";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import Link from "next/link";

type CreateOrderPayload = Omit<
  Order,
  "id" | "user" | "status" | "createdAt" | "updatedAt" | "orderEventTimeline"
>;

function buildOrderData(params: {
  cartProducts: Order["products"];
  totalAmount: number;
  totalUnits: number;
  totalGST: number;
  totalDiscount: number;
}): CreateOrderPayload {
  const { cartProducts, totalAmount, totalUnits, totalGST, totalDiscount } =
    params;
  return {
    products: cartProducts,
    totals: {
      amount: totalAmount,
      items: cartProducts.length,
      units: totalUnits,
      gst: totalGST,
      discount: totalDiscount,
    },
  };
}

type CheckoutFooterProps = {
  setIsPlacingOrder: React.Dispatch<React.SetStateAction<boolean>>;
  isPlacingOrder: boolean;
};

export default function CheckoutFooter({
  setIsPlacingOrder,
  isPlacingOrder,
}: CheckoutFooterProps) {
  const router = useSafeRouter();

  useRequireUserProfile(true);

  const { currentUser } = useAuthState();
  const { clientUser, clientUserLoading } = useUserProfileState();

  const { cartProducts, cartTotals, loading: cartLoading } = useCartState();
  const { resetCartContext } = useCartActions();

  const totalAmount = cartTotals?.totalAmount ?? 0;
  const totalUnits = cartTotals?.totalUnits ?? 0;
  const totalDiscount = cartTotals?.totalDiscount ?? 0;
  const totalGST = cartTotals?.totalGST ?? 0;
  const grossAmount = Math.max(0, totalAmount + totalDiscount - totalGST);

  const isDisabled =
    cartLoading ||
    isPlacingOrder ||
    cartProducts.length === 0 ||
    !currentUser ||
    clientUserLoading ||
    !clientUser;

  const orderPlaceHandler = useCallback(async () => {
    if (!currentUser) {
      toast.error("Please login to place an order");
      router.push("/login");
      return;
    }

    if (!clientUser) {
      toast.error("Please complete your profile before placing an order");
      router.push("/account/profile?redirect=/checkout");
      return;
    }

    if (cartProducts.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const token = await currentUser.getIdToken();
      if (!token) throw new Error("No token");

      const data = buildOrderData({
        cartProducts,
        totalAmount,
        totalUnits,
        totalGST,
        totalDiscount,
      });

      const orderResponse = await createOrder(data, clientUser, token);

      if (orderResponse?.error || !orderResponse?.orderId) {
        toast.error("Error!", {
          description: orderResponse?.message || "Order failed",
        });
        return;
      }

      const orderId = orderResponse.orderId;

      await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "order_placed_to_admin_v2",
          customerFirmName: clientUser.firmName,
          customerName: clientUser.displayName,
          orderId,
          customerPhone: clientUser.phone,
        }),
      });

      await notifyUserAction({
        uid: clientUser.uid,
        type: "order",
        title: "📦 Order Update",
        body: `Your order #${orderId} has been placed!`,
        url: `${getBaseUrl()}/order-history/${orderId}`,
        clickAction: "view_order",
        status: "created",
      });

      await notifyAdminsByRoleAction({
        type: "order",
        title: "📦 New Order Received",
        body: `${clientUser.displayName ?? "A customer"} from ${clientUser.firmName ?? "a firm"} placed order #${orderId}`,
        url: `${getBaseUrl()}/order-history/${orderId}`,
        clickAction: "view_order",
        status: "created",
      });

      router.push(`/order-placed/${orderId}`);
      await resetCartContext();
      setIsPlacingOrder(false);
    } catch (err) {
      console.error(err);
      toast.error("Error!", { description: "Could not place order" });
      setIsPlacingOrder(false);
    }
  }, [
    cartProducts,
    clientUser,
    currentUser,
    resetCartContext,
    router,
    setIsPlacingOrder,
    totalAmount,
    totalDiscount,
    totalGST,
    totalUnits,
  ]);

  return (
    <>
      <div className="flex w-full flex-col items-center justify-between gap-2 py-3 pb-8 md:hidden">
        <div className="flex w-full flex-col items-center justify-center gap-1 border-b px-1 pb-2">
          <p className="text-muted-foreground flex w-full items-center justify-between gap-1 text-xs">
            Gross Amount :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="text-sm font-medium">
                {currencyFormatter(grossAmount)}/-
              </span>
            )}
          </p>
          <p className="text-muted-foreground flex w-full items-center justify-between gap-1 text-xs">
            Total Discount :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="text-xs font-medium text-green-700">
                - {currencyFormatter(totalDiscount)}/-
              </span>
            )}
          </p>
          <p className="text-muted-foreground flex w-full items-center justify-between gap-1 text-xs">
            Total GST :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="text-xs font-medium">
                + {currencyFormatter(totalGST)}/-
              </span>
            )}
          </p>
        </div>
        <p className="text-muted-foreground flex w-full items-center justify-between gap-1 text-sm font-semibold">
          Net Amount :
          {cartLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <span className="text-primary text-xl font-semibold">
              {currencyFormatter(totalAmount)}/-
            </span>
          )}
        </p>
        <div className="flex w-full items-center justify-between gap-4">
          <Link
            className="border-muted-foreground hover:bg-muted flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-xs transition-colors"
            href="/cart"
          >
            <PencilLineIcon className="size-5" />
            Edit Cart
          </Link>

          <Button
            className="flex flex-1 items-center justify-center gap-2"
            disabled={isDisabled}
            onClick={orderPlaceHandler}
            type="button"
          >
            {isPlacingOrder ? (
              <>
                Placing your order...
                <Loader2Icon className="size-4 animate-spin" />
              </>
            ) : (
              <>
                Place Order
                <PackageCheck className="size-5" />
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="hidden w-full items-center justify-between py-3 pb-8 md:flex">
        <Link
          className="border-muted-foreground hover:bg-muted flex h-full items-center justify-center rounded-md border px-3 py-1 text-xs transition-colors"
          href="/cart"
        >
          <PencilLineIcon className="size-5" />
          Edit Cart
        </Link>
        <div className="flex min-w-75 flex-col items-end justify-center gap-1 text-xs">
          <p className="text-muted-foreground flex w-full items-center justify-between gap-2">
            Gross Amount :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="font-medium">
                {currencyFormatter(grossAmount)}/-
              </span>
            )}
          </p>
          <p className="text-muted-foreground flex w-full items-center justify-between gap-2">
            Total Discount :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="font-medium text-green-700">
                - {currencyFormatter(totalDiscount)}/-
              </span>
            )}
          </p>
          <p className="text-muted-foreground flex w-full items-center justify-between gap-2">
            Total GST :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="font-medium">
                + {currencyFormatter(totalGST)}/-
              </span>
            )}
          </p>
          <p className="text-muted-foreground flex w-full items-center justify-between gap-2 border-t pt-1 text-sm font-semibold">
            Net Amount :
            {cartLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <span className="text-primary text-xl font-semibold">
                {currencyFormatter(totalAmount)}/-
              </span>
            )}
          </p>
        </div>
        <Button
          className="flex items-center justify-center gap-4"
          disabled={isDisabled}
          onClick={orderPlaceHandler}
          type="button"
        >
          {isPlacingOrder ? (
            <>
              Placing your order...
              <Loader2Icon className="size-4 animate-spin" />
            </>
          ) : (
            <>
              Place Order
              <PackageCheck className="size-5" />
            </>
          )}
        </Button>
      </div>
    </>
  );
}
