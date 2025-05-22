"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CircleXIcon } from "lucide-react";

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

  // 1) Read current categories from ?category=… params (can be repeated)
  const selected = params.getAll("category");

  // 2) Toggle one on/off and push a new URL
  function toggleCat(cat: string) {
    // build a fresh URLSearchParams from the existing ones
    const qp = new URLSearchParams(Array.from(params.entries()));
    // remove all old category keys
    qp.delete("category");

    // compute new list
    const next = selected.includes(cat)
      ? selected.filter((c) => c !== cat)
      : [...selected, cat];

    // append each back
    next.forEach((c) => qp.append("category", c));

    // reset page to 1 when filters change
    qp.set("page", "1");

    // finally push the new route
    router.push(`/products-list?${qp.toString()}`);
  }
  function clearCategories() {
    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("category");
    qp.set("page", "1");
    router.push(`/products-list?${qp.toString()}`);
  }

  return (
    <Card className="no-scrollbar flex flex-row items-center justify-center gap-0 border-0 p-0 shadow-none">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((label) => (
          <Button
            key={label}
            variant={selected.includes(label) ? "default" : "outline"}
            onClick={() => toggleCat(label)}
            className={clsx(
              "min-w-max shrink-0 rounded-full px-4 py-2 text-sm",
              selected.includes(label) && "bg-primary text-white",
            )}
          >
            {label}
          </Button>
        ))}
      </div>
      {selected.length > 0 && (
        <div
          className={clsx(
            "bg-muted no-scrollbar w-0 cursor-pointer rounded-full p-1 opacity-0 transition-all duration-300 ease-in-out",
            selected.length > 0 && "no-scrollbar w-fit opacity-100",
          )}
          onClick={clearCategories}
        >
          <CircleXIcon className="text-primary size-6" />
        </div>
      )}
    </Card>
  );
}
