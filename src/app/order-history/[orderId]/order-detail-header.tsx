"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type OrderDetailHeaderProps = {
  orderId: string;
};

export default function OrderDetailHeader({ orderId }: OrderDetailHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex w-full flex-col gap-1 md:flex-row md:items-end md:justify-between">
      <div className="text-primary text-lg font-semibold">Order Details</div>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy order id"
        className="text-muted-foreground flex items-center gap-1.5"
      >
        <span className="text-primary text-sm font-semibold md:text-base">
          {orderId}
        </span>
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </button>

      <p className="text-muted-foreground mt-1 text-xs md:text-sm">
        Complete order summary, updates, and event timeline.
      </p>
    </div>
  );
}
