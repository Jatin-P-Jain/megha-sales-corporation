"use client";
import { Copy, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import { toast } from "sonner";

interface OrderIdBlockProps {
  orderId: string;
}

export function OrderIdBlock({ orderId }: OrderIdBlockProps) {
  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied");
    } catch {
      toast.error("Failed to copy Order ID");
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border bg-zinc-50 px-2 py-3">
      <div className="flex w-full flex-col items-center justify-center">
        <div className="text-muted-foreground text-xs">Order ID</div>
        <div className="mt-1 font-mono text-sm font-semibold break-all text-zinc-900">
          {orderId}{" "}
          <Copy
            className="text-muted-foreground inline-block size-4 cursor-pointer"
            onClick={handleCopyOrderId}
          />
        </div>
      </div>
      <Button asChild className="w-full">
        <SafeLink href={`/order-history/${orderId}`}>
          View order details
        </SafeLink>
      </Button>
      <p className="text-muted-foreground flex w-full items-center justify-center gap-0 text-xs">
        <Lightbulb className="inline-block size-4" /> You can track this order
        anytime from{" "}
        <SafeLink
          href="/order-history"
          className="text-primary ml-1 font-semibold whitespace-nowrap underline"
        >
          Order History
        </SafeLink>
        .
      </p>
    </div>
  );
}
