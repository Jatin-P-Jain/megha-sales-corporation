"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CircleXIcon, Loader2Icon } from "lucide-react";
import { useTransition, useState, useEffect } from "react";

export const STATUSES: { label: string; value: string }[] = [
  { label: "Draft", value: "draft" },
  { label: "For Sale", value: "for-sale" },
  { label: "Discontinued", value: "discontinued" },
  { label: "Out of Stock", value: "out-of-stock" },
];

export default function StatusChips() {
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
      router.push(`/products-list?${qp.toString()}`);
    });
  }

  // clear all categories
  function clearStatuses() {
    setPendingStatus("clear");

    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("status");
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/products-list?${qp.toString()}`);
    });
  }

  return (
    <div
      className={clsx(
        "grid grid-cols-[8fr_1fr] gap-2",
        selected.length == 0 && "!grid-cols-[1fr]",
      )}
    >
      <Card className="no-scrollbar flex flex-row items-center justify-start gap-1 overflow-x-auto border-0 p-0 shadow-none">
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
                "h-fit min-w-max shrink-0 rounded-full p-1 px-3 text-sm md:px-6",
                isSel &&
                  `${
                    value === "draft"
                      ? "border-amber-600 bg-amber-100 text-yellow-600"
                      : value === "for-sale"
                        ? "border-green-700 bg-green-100 text-green-700"
                        : value === "out-of-stock"
                          ? "border-zinc-800 bg-zinc-100 text-zinc-800"
                          : value === "discontinued"
                            ? "border-red-600 bg-red-100 text-red-600"
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
            "flex items-center justify-center rounded-full p-2",
            pendingStatus === "clear" && isPending
              ? "cursor-wait opacity-60"
              : "bg-muted cursor-pointer",
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
