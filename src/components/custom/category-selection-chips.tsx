"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // can also use Toggle if you prefer
import { useState } from "react";
import clsx from "clsx";

const categories = ["Nuts", "Suspensions", "Fastners", "Repair Kits"];

export default function CategoryChips() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Card className="gap-0 p-0 shadow-none border-0 no-scrollbar">
      <div className="flex overflow-x-auto no-scrollbar gap-2">
        {categories.map((label) => (
          <Button
            key={label}
            variant={selected === label ? "default" : "outline"}
            onClick={() =>
              setSelected((prev) => (prev === label ? null : label))
            }
            className={clsx(
              "shrink-0 min-w-max text-sm px-4 py-2 rounded-full transition duration-300 ease-in-out",
              selected === label && "bg-primary text-white"
            )}
          >
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
