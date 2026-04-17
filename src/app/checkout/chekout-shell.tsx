"use client";
import CheckoutFooter from "./checkout-footer";
import { CheckoutItems } from "./checkout-items";
import { useState } from "react";
import OrderPlacingGif from "@/assets/icons/order-placing.gif";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function CheckoutShell() {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      {isPlacingOrder && (
        <div
          className="border-primary bg-muted-foreground/40 pointer-events-auto fixed inset-0 top-17 z-50 flex h-[calc(100vh-28px)] flex-col items-center justify-start border border-dashed pt-25 md:top-21"
          aria-modal="true"
          role="dialog"
        >
          <Image src={OrderPlacingGif} alt="Placing your order..." />
          <div className="text-muted-foreground mx-4 flex flex-col items-center justify-center rounded-md bg-white p-4 text-xs md:text-sm">
            <span className="text-primary flex items-center justify-center gap-2 font-semibold">
              Placing your order <Loader2 className="size-4 animate-spin" />
            </span>{" "}
            Please wait while we process your order and prepare it for delivery.
          </div>
        </div>
      )}
      <>
        <div className="fixed inset-x-0 top-0 z-30 mx-auto flex h-40 w-full max-w-6xl flex-col items-end justify-end rounded-lg bg-white px-4 py-4 shadow-md md:h-50">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
              Checkout
            </h1>
            <p className="text-muted-foreground flex flex-col items-start justify-start gap-1 text-xs md:text-sm">
              <span>Review your items and order total.</span>
              <span className="font-semibold text-black">
                <span>&apos;Place Order&apos;</span> to complete your purchase.
              </span>
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 top-44 bottom-52 mx-auto w-full max-w-5xl px-4 md:top-54 md:bottom-38">
          <div className="h-full w-full overflow-hidden">
            <CheckoutItems />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-fit w-full max-w-5xl flex-col items-end justify-end rounded-t-lg bg-white px-4 py-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <CheckoutFooter
            setIsPlacingOrder={setIsPlacingOrder}
            isPlacingOrder={isPlacingOrder}
          />
        </div>
      </>
    </div>
  );
}
