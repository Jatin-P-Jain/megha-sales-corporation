import React from "react";
import { BadgeCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function OrderPlacedPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  return (
    <div className="mx-auto flex max-w-screen-lg flex-col items-center justify-center gap-4 py-12">
      <div className="flex w-full flex-col items-center justify-center gap-4 px-8">
        <BadgeCheckIcon className="size-20 text-green-800" />
        <div className="flex flex-col items-center justify-center gap-4 text-base">
          <p className="text-primary font-semibold">Order Placed!</p>
          <p className="text-muted-foreground font-semibold">
            Order Id: {orderId}
          </p>
          <p>We will pack your order shortly.</p>
        </div>{" "}
        <Button asChild className="w-full">
          <Link href={`/order-history/${orderId}`}>View Order</Link>
        </Button>
      </div>

      <div className="mx-auto flex w-full flex-col items-center justify-center gap-4 px-4">
        <span className="my-2 flex w-full justify-center text-[14px] text-zinc-500">
          or
        </span>
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <Link href={`/products-list`}>Explore Products</Link>
          </Button>
          <Button asChild className="w-full">
            <Link href={`/`}>Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
