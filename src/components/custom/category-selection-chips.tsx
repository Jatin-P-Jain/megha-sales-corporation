"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // can also use Toggle if you prefer
import { useState } from "react";
import clsx from "clsx";

const categories = [
  "Nuts",
  "Suspensions",
  "Fastners",
  "Repair Kits",
  "Nuts",
  "Suspensions",
  "Fastners",
  "Repair Kits",
  "Nuts",
  "Suspensions",
  "Fastners",
  "Repair Kits",
];

export default function CategoryChips() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Card className="no-scrollbar gap-0 border-0 p-0 shadow-none">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((label, index) => (
          <Button
            key={index}
            variant={selected === label ? "default" : "outline"}
            onClick={() =>
              setSelected((prev) => (prev === label ? null : label))
            }
            className={clsx(
              "min-w-max shrink-0 rounded-full px-2 py-0 text-sm transition duration-300 ease-in-out sm:px-4 sm:py-2",
              selected === label && "bg-primary text-white",
            )}
          >
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
