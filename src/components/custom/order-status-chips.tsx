"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CircleXIcon, Loader2Icon } from "lucide-react";
import { useTransition, useState, useEffect } from "react";

export const STATUSES: { label: string; value: string }[] = [
  { label: "Pending", value: "pending" },
  { label: "Packing", value: "packing" },
  { label: "Complete", value: "complete" },
];

export default function OrderStatusChips() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // track exactly which chip is being toggled (or "clear" for the clear button)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // reset pendingCategory once React finishes the transition
  useEffect(() => {
    if (!isPending) {
      setPendingStatus(null);
    }
  }, [isPending]);

  // read current selected categories
  const selected = params.getAll("status");

  // toggle one category on/off
  function toggleStatus(status: string) {
    // mark this one as pending
    setPendingStatus(status);

    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("status");

    const next = selected.includes(status)
      ? selected.filter((c) => c !== status)
      : [...selected, status];

    next.forEach((s) => qp.append("status", s));
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/order-history?${qp.toString()}`);
    });
  }

  // clear all categories
  function clearStatuses() {
    setPendingStatus("clear");

    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("status");
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/order-history?${qp.toString()}`);
    });
  }

  return (
    <div className={clsx("flex gap-2")}>
      <Card className="no-scrollbar flex w-full flex-row items-center justify-end gap-1 overflow-x-auto border-0 p-0 shadow-none">
        {STATUSES.map(({ label, value }) => {
          const isSel = selected.includes(value);
          const isThisPending = isPending && pendingStatus === value;
          return (
            <Button
              key={label}
              variant={isSel ? "default" : "outline"}
              onClick={() => toggleStatus(value)}
              disabled={isThisPending}
              className={clsx(
                "h-fit min-w-max shrink-0 rounded-full p-1 px-3 text-xs md:px-6 md:text-sm",
                isSel &&
                  `${
                    value === "pending"
                      ? "border-amber-600 bg-amber-100 text-yellow-600"
                      : value === "complete"
                        ? "border-green-700 bg-green-100 text-green-700"
                        : value === "packing"
                          ? "border-sky-700 bg-sky-100 text-sky-700"
                          : ""
                  }`,
                "border-1",
                isThisPending && "cursor-wait opacity-60",
              )}
            >
              {label}
              {isThisPending && (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              )}
            </Button>
          );
        })}
      </Card>
      {selected.length > 0 && (
        <div
          onClick={clearStatuses}
          className={clsx(
            "flex w-fit items-center justify-center rounded-full p-0",
            pendingStatus === "clear" && isPending
              ? "cursor-wait opacity-60"
              : "cursor-pointer",
          )}
        >
          {pendingStatus === "clear" && isPending ? (
            <Loader2Icon className="h-5 w-5 animate-spin" />
          ) : (
            <CircleXIcon className="text-muted-foreground h-5 w-5" />
          )}
        </div>
      )}
    </div>
  );
}
