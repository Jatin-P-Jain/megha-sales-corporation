"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2Icon, PackageCheck } from "lucide-react";
import { useCartActions, useCartState } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";
import { createOrder } from "./actions";
import { useAuthState } from "@/context/useAuth";
import { toast } from "sonner";
import { OrderData } from "@/types/order";
import { getBaseUrl } from "@/lib/utils";
import {
  notifyUserAction,
  notifyAdminsByRoleAction,
} from "@/actions/notify-user";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import Link from "next/link";

function buildOrderData(params: {
  cartProducts: OrderData["products"];
  totalAmount: number;
  totalUnits: number;
}): OrderData {
  const { cartProducts, totalAmount, totalUnits } = params;
  return {
    products: cartProducts,
    totals: {
      amount: totalAmount,
      items: cartProducts.length,
      units: totalUnits,
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

      const data = buildOrderData({ cartProducts, totalAmount, totalUnits });

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
        url: `${getBaseUrl()}/order-history?orderId=${orderId}`,
        clickAction: "view_order",
        status: "created",
      });

      await notifyAdminsByRoleAction({
        type: "order",
        title: "📦 New Order Received",
        body: `${clientUser.displayName ?? "A customer"} from ${clientUser.firmName ?? "a firm"} placed order #${orderId}`,
        url: `${getBaseUrl()}/order-history?orderId=${orderId}`,
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
    totalUnits,
  ]);

  return (
    <>
      <div className="flex w-full flex-col items-center justify-between gap-3 py-3 pb-8 md:hidden">
        <p className="text-muted-foreground flex w-full items-center justify-between gap-1 text-xs">
          Total Amount :
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
            className="border-muted-foreground hover:bg-muted flex flex-1 items-center justify-center rounded-md border py-2 text-xs transition-colors"
            href="/cart"
          >
            <ChevronLeft className="size-5" />
            Go Back to Cart
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
          <ChevronLeft className="size-5" />
          Go Back to Cart
        </Link>
        <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
          Total Amount :
          {cartLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <span className="text-primary text-xl font-semibold">
              {currencyFormatter(totalAmount)}/-
            </span>
          )}
        </p>
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
