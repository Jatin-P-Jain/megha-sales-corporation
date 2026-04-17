import React from "react";

import { BadgeCheckIcon, ListStart } from "lucide-react";
import { Button } from "@/components/ui/button";
import BankDetails from "@/components/custom/bank-details";
import OrderPlacedClientEffects from "./order-placed-client-effects";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import { OrderIdBlock } from "./orderId-block";
import Image from "next/image";
import MSC_Logo from "../../../../public/icon-512x512.png";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";

export default async function OrderPlacedPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
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

        <OrderIdBlock orderId={orderId} />
        <BankDetails />

        <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary w-full md:flex-1"
          >
            <SafeLink href="/products-list">
              <ListStart className="size-4" />
              Explore more products
            </SafeLink>
          </Button>
          <div className="w-full md:flex-1">
            <FeedbackDialog
              trigger={
                <Button
                  variant="outline"
                  className="border-primary text-primary w-full md:flex-1"
                >
                  ⭐️ Share feedback
                </Button>
              }
            />
          </div>
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary w-full md:flex-1"
          >
            <SafeLink href="/">
              {" "}
              <Image
                src={MSC_Logo}
                alt="MSC Logo"
                width={24}
                height={24}
                className="size-6"
              />
              Home
            </SafeLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
