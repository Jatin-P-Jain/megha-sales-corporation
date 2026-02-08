import React from "react";
import Link from "next/link";
import { BadgeCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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


      <div className="w-full flex flex-col items-center text-center">
        <div className="mb-4 grid place-items-center rounded-full bg-green-50 p-4">
          <BadgeCheckIcon className="size-14 text-green-800 md:size-16" />
        </div>

        <h1 className="text-primary text-xl font-semibold md:text-2xl">
          Order placed successfully.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          We&apos;ll start packing your order shortly and will notify you once it&apos;s on the way.
        </p>

        <div className="mt-5 w-full rounded-lg border bg-zinc-50 px-4 py-3">
          <div className="text-muted-foreground text-xs">Order ID</div>
          <div className="mt-1 break-all font-mono text-sm font-semibold text-zinc-900">
            {orderId}
          </div>
        </div>

        <div className="mt-6 grid w-full gap-3">
          <Button asChild className="w-full">
            <Link href={`/order-history?${newSearchParams.toString()}`}>
              View order details
            </Link>
          </Button>

          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
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
