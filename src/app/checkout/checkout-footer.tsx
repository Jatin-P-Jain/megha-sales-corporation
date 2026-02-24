"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, ThumbsUpIcon } from "lucide-react";
import { useCartActions, useCartState } from "@/context/cartContext"; // or "@/context/cart-context"
import currencyFormatter from "@/lib/currency-formatter";
import { createOrder } from "./actions";
import { useAuthState } from "@/context/useAuth";
import { toast } from "sonner";
import { OrderData } from "@/types/order";
import { useRouter } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";

export default function CheckoutFooter() {
  const router = useRouter();

  const { currentUser, clientUser } = useAuthState();
  const { cartProducts, cartTotals, loading } = useCartState();
  const { resetCartContext } = useCartActions();

  const [isPlacingOrder, setIsOrderPlacing] = useState(false);

  const { totalAmount = 0, totalUnits = 0 } = cartTotals || {};

  const isDisabled = useMemo(() => {
    return (
      loading ||
      isPlacingOrder ||
      cartProducts.length === 0 ||
      !currentUser ||
      !clientUser
    );
  }, [loading, isPlacingOrder, cartProducts.length, currentUser, clientUser]);

  const orderPlaceHandler = useCallback(async () => {
    if (!currentUser) {
      toast.error("Please login to place an order");
      router.push("/login");
      return;
    }
    if (!clientUser) {
      toast.error("Error!", { description: "User not found" });
      return;
    }

    setIsOrderPlacing(true);
    try {
      const token = await currentUser.getIdToken();
      if (!token) throw new Error("No token");

      const data: OrderData = {
        products: cartProducts,
        totals: {
          amount: totalAmount,
          items: cartProducts.length,
          units: totalUnits,
        },
      };

      const orderResponse = await createOrder(data, clientUser, token);

      if (orderResponse?.error || !orderResponse?.orderId) {
        toast.error("Error!", {
          description: orderResponse?.message || "Order failed",
        });
        return;
      }

      // side-effects (fire-and-forget is ok; but keep awaited if you rely on them)
      await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "order_placed_to_admin",
          customerName: clientUser.displayName,
          orderId: orderResponse.orderId,
          customerPhone: clientUser.phone,
        }),
      });

      await fetch("/api/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: clientUser.uuid,
          title: "🛒 Order Update",
          body: `Your order #${orderResponse.orderId} has been placed!`,
          url: `${getBaseUrl()}/order-history/${orderResponse.orderId}`,
          clickAction: "view_order",
          status: "created",
        }),
      });

      await resetCartContext();

      // ✅ client-side navigation after click
      router.push(`/order-placed/${orderResponse.orderId}`); // [web:765]
    } catch (err) {
      console.error(err);
      toast.error("Error!", { description: "Could not place order" });
    } finally {
      setIsOrderPlacing(false);
    }
  }, [
    currentUser,
    clientUser,
    cartProducts,
    totalAmount,
    totalUnits,
    resetCartContext,
    router,
  ]);

  return (
    <div className="flex w-full items-center justify-between py-3 pb-8">
      <p className="text-muted-foreground flex flex-col text-xs md:text-sm">
        Total Amount :
        {loading ? (
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
