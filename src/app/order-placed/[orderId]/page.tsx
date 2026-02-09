import React from "react";
import Link from "next/link";
import { BadgeCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import BankDetails from "@/components/custom/bank-details";

export default async function OrderPlacedPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const newSearchParams = new URLSearchParams();
  newSearchParams.set("orderId", orderId);

  return (
    <div className="mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <div className="mb-4 grid place-items-center rounded-full bg-green-50 p-4">
          <BadgeCheckIcon className="size-14 text-green-800 md:size-16" />
        </div>

        <h1 className="text-primary text-xl font-semibold md:text-2xl">
          Order placed successfully.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          We&apos;ll start packing your order shortly and will notify you once
          it&apos;s on the way.
        </p>

        <div className="flex w-full flex-col gap-4 rounded-lg border bg-zinc-50 px-4 py-3">
          <div className="flex w-full flex-col items-center justify-center">
            <div className="text-muted-foreground text-xs">Order ID</div>
            <div className="mt-1 font-mono text-sm font-semibold break-all text-zinc-900">
              {orderId}
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href={`/order-history?${newSearchParams.toString()}`}>
              View order details
            </Link>
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
              <Link href="/products-list">Explore products</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go to home</Link>
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
