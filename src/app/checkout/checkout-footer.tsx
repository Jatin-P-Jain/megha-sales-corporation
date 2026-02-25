"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, ThumbsUpIcon } from "lucide-react";
import { useCartActions, useCartState } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";
import { createOrder } from "./actions";
import { useAuthState } from "@/context/useAuth";
import { toast } from "sonner";
import { OrderData } from "@/types/order";
import { useRouter } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";

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

export default function CheckoutFooter() {
  const router = useRouter();

  useRequireUserProfile(true);

  const { currentUser } = useAuthState();
  const { clientUser, clientUserLoading } = useUserProfileState();

  const { cartProducts, cartTotals, loading: cartLoading } = useCartState();
  const { resetCartContext } = useCartActions();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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
          templateKey: "order_placed_to_admin",
          customerName: clientUser.displayName,
          orderId,
          customerPhone: clientUser.phone,
        }),
      });

      await fetch("/api/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: clientUser.uid,
          title: "🛒 Order Update",
          body: `Your order #${orderId} has been placed!`,
          url: `${getBaseUrl()}/order-history/${orderId}`,
          clickAction: "view_order",
          status: "created",
        }),
      });

      await resetCartContext();
      router.push(`/order-placed/${orderId}`);
    } catch (err) {
      console.error(err);
      toast.error("Error!", { description: "Could not place order" });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    cartProducts,
    clientUser,
    currentUser,
    resetCartContext,
    router,
    totalAmount,
    totalUnits,
  ]);

  return (
    <div className="flex w-full items-center justify-between py-3 pb-8">
      <p className="text-muted-foreground flex flex-col text-xs md:text-sm">
        Total Amount :
        {cartLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <span className="text-primary text-base font-semibold">
            {currencyFormatter(totalAmount)}/-
          </span>
        )}
      </p>

      <Button
        className="flex items-center justify-center gap-2"
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
            Confirm &amp; Place Order
            <ThumbsUpIcon className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
