import React from "react";

import { BadgeCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import BankDetails from "@/components/custom/bank-details";
import OrderPlacedClientEffects from "./order-placed-client-effects";
import { SafeLink } from "@/components/custom/utility/SafeLink";

export default async function OrderPlacedPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const newSearchParams = new URLSearchParams();
  newSearchParams.set("orderId", orderId);

  return (
    <div className="mx-auto flex items-center justify-center">
      <OrderPlacedClientEffects />
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <div className="mb-4 grid place-items-center rounded-full bg-green-50 p-4">
          <BadgeCheckIcon className="size-14 text-green-800 md:size-16" />
        </div>

        <h1 className="text-primary flex flex-col items-center justify-center gap-2 text-xl font-semibold md:text-2xl">
          Your Order has been placed.
          <span className="text-base">Thank you for your purchase!</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          We&apos;ll start packing your order shortly and will notify you once
          it&apos;s on the way.
        </p>

        <div className="flex w-full flex-col gap-4 rounded-lg border bg-zinc-50 px-2 py-3">
          <div className="flex w-full flex-col items-center justify-center">
            <div className="text-muted-foreground text-xs">Order ID</div>
            <div className="mt-1 font-mono text-sm font-semibold break-all text-zinc-900">
              {orderId}
            </div>
          </div>
          <Button asChild className="w-full">
            <SafeLink href={`/order-history?${newSearchParams.toString()}`}>
              View order details
            </SafeLink>
          </Button>
          <BankDetails />
        </div>

        <div className="grid w-full gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-muted h-px flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <div className="bg-muted h-px flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="w-full">
              <SafeLink href="/products-list">Explore products</SafeLink>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <SafeLink href="/">Go to home</SafeLink>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Tip: You can track this order anytime from “Order History”.
        </p>
      </div>
    </div>
  );
}
