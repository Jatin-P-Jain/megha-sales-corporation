"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, ThumbsUpIcon } from "lucide-react";
import { useCart } from "@/context/cartContext";
import currencyFormatter from "@/lib/currency-formatter";
import { createOrder } from "./actions";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";
import { OrderData } from "@/types/order";
import { redirect } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";

export default function CheckoutFooter() {
  const auth = useAuth();
  const { cart, loading, cartProducts, resetCartContext, cartTotals } =
    useCart();
  const [hasMounted, setHasMounted] = useState(false);
  const [isPlacingOrder, setIsOrderPlacing] = useState(false);

  const { totalAmount, totalUnits } = cartTotals;
  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 4) debounce the empty-cart state
  const [showEmpty, setShowEmpty] = useState(false);
  useEffect(() => {
    if (cart.length > 0) {
      // if we have items, immediately hide “empty”
      setShowEmpty(false);
      return;
    }
    // if no items, wait 200 ms before showing empty
    const t = setTimeout(() => {
      setShowEmpty(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cart.length]);

  const isValueAbsent =
    !hasMounted || loading || (cart.length === 0 && !showEmpty);

  const orderPlaceHandler = async () => {
    setIsOrderPlacing(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsOrderPlacing(false);
      return;
    }
    if (!auth.clientUser) {
      toast.error("Error!", { description: "User not found" });
      setIsOrderPlacing(false);
      return;
    }
    const data: OrderData = {
      products: cartProducts,
      totals: {
        amount: totalAmount,
        items: cartProducts.length,
        units: totalUnits,
      },
    };

    const orderResponse = await createOrder(data, auth.clientUser, token);

    if (!!orderResponse.error || !orderResponse.orderId) {
      toast.error("Error!", { description: orderResponse.message });
      setIsOrderPlacing(false);
      return;
    }

    await fetch("/api/wa-send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateKey: "admin_order_recieved_v1",
        customerName: auth.clientUser?.displayName,
        orderId: orderResponse.orderId,
        customerPhone: auth.clientUser?.phone,
      }),
    });
    await fetch("/api/notify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: auth.clientUser?.uid,
        title: "🛒 Order Update",
        body: `Your order #${orderResponse.orderId} has been placed!`,
        url: `${getBaseUrl()}/order-history/${orderResponse.orderId}`,
        clickAction: "view_order",
        status: "created",
      }),
    });

    // toast.success("Order Placed!");
    setIsOrderPlacing(false);
    resetCartContext();
    redirect(`/order-placed/${orderResponse.orderId}`);
  };
  return (
    <div className="flex w-full items-center justify-between py-4">
      <p className="text-muted-foreground flex flex-col text-xs md:text-sm">
        Total Amount :{"   "}
        {!isValueAbsent ? (
          <span className="text-primary text-base font-semibold">
            {currencyFormatter(totalAmount)}/-
          </span>
        ) : (
          <Loader2Icon className="size-4 animate-spin" />
        )}
      </p>
      <Button
        className="flex items-center justify-center"
        disabled={isValueAbsent || isPlacingOrder || cart.length === 0}
        onClick={orderPlaceHandler}
      >
        {isPlacingOrder ? (
          <>
            Placing your order...{" "}
            <Loader2Icon className="size-4 animate-spin" />
          </>
        ) : (
          <>
            {" "}
            Confirm & Place Order
            <ThumbsUpIcon className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
