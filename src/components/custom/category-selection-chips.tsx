"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CircleXIcon, Loader2Icon } from "lucide-react";
import { useTransition, useState, useEffect } from "react";

const categories = [
  "Nuts",
  "Suspensions",
  "Fastners",
  "Repair Kits",
  "Bushing",
];

export default function CategoryChips() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // track exactly which chip is being toggled (or "clear" for the clear button)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  // reset pendingCategory once React finishes the transition
  useEffect(() => {
    if (!isPending) {
      setPendingCategory(null);
    }
  }, [isPending]);

  // read current selected categories
  const selected = params.getAll("category");

  // toggle one category on/off
  function toggleCat(cat: string) {
    // mark this one as pending
    setPendingCategory(cat);

    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("category");

    const next = selected.includes(cat)
      ? selected.filter((c) => c !== cat)
      : [...selected, cat];

    next.forEach((c) => qp.append("category", c));
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/products-list?${qp.toString()}`);
    });
  }

  // clear all categories
  function clearCategories() {
    setPendingCategory("clear");

    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("category");
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
      <Card className="no-scrollbar flex flex-row items-center gap-2 overflow-x-auto border-0 p-0 shadow-none ">
        {categories.map((label) => {
          const isSel = selected.includes(label);
          const isThisPending = isPending && pendingCategory === label;
          return (
            <Button
              key={label}
              variant={isSel ? "default" : "outline"}
              onClick={() => toggleCat(label)}
              disabled={isThisPending}
              className={clsx(
                "min-w-max shrink-0 rounded-full px-4 py-2 text-sm",
                isSel && "bg-primary text-white",
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
          onClick={clearCategories}
          className={clsx(
            "flex items-center justify-center rounded-full p-2",
            pendingCategory === "clear" && isPending
              ? "cursor-wait opacity-60"
              : "bg-muted cursor-pointer",
          )}
        >
          {pendingCategory === "clear" && isPending ? (
            <Loader2Icon className="h-5 w-5 animate-spin" />
          ) : (
            <CircleXIcon className="text-muted-foreground h-5 w-5" />
          )}
        </div>
      )}
    </div>
  );
}
