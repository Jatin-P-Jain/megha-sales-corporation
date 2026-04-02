"use client";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import CheckoutFooter from "./checkout-footer";
import { CheckoutItems } from "./checkout-items";
import { useState } from "react";
import OrderPlacingGif from "@/assets/icons/order-placing.gif";
import Image from "next/image";
import { Loader2 } from "lucide-react";

type CheckoutShellProps = {
  isAdmin?: boolean;
};

export default function CheckoutShell({ isAdmin = false }: CheckoutShellProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  return (
    <>
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
        <div
          className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-45 w-full max-w-6xl flex-col items-end justify-end rounded-lg bg-white px-4 py-4 shadow-md md:h-50`}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1">
            <EllipsisBreadCrumbs
              items={[
                {
                  href: `${isAdmin ? "/admin-dashboard" : "/"}`,
                  label: `${isAdmin ? "Admin Dashboard" : "Home"}`,
                },
                { href: "/products-list", label: "Product Listings" },
                { href: "/cart", label: "Cart" },
                { label: "Checkout" },
              ]}
            />
            <h1 className="text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
              Checkout
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Review your items and total.{" "}
              <span className="font-semibold text-black">
                &apos;Confirm & Place Order&apos;
              </span>{" "}
              to complete.
            </p>
          </div>
        </div>

        <div
          className={`flex flex-1 overflow-auto scroll-auto pt-30 md:pt-28`}
        >
          <div className="no-scrollbar mb-20 flex h-full max-h-[450px] w-full overflow-auto">
            <CheckoutItems />
          </div>
        </div>

        <div
          className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex h-fit w-full max-w-6xl flex-col items-end justify-end rounded-t-lg bg-white px-4 py-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}
        >
          <CheckoutFooter
            setIsPlacingOrder={setIsPlacingOrder}
            isPlacingOrder={isPlacingOrder}
          />
        </div>
      </>
    </>
  );
}
