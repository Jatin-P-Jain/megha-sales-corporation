"use client";

import { useState } from "react";
import { FunnelPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const FILTERS = [
  { key: "brand", label: "Brand" },
  { key: "vehicle", label: "Vehicle Company" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
];

export default function MoreFilters({ showText = true }: { showText?: boolean }) {
  const [selected, setSelected] = useState(FILTERS[0].key);

  // You can replace these with your UI form controls
  function FilterSection({ type }: { type: string }) {
    switch (type) {
      case "brand":
        return <div>Brand Filter Controls (dropdown, tags, etc.)</div>;
      case "vehicle":
        return <div>Vehicle Company Filter Controls</div>;
      case "category":
        return <div>Category Filter Controls</div>;
      case "price":
        return <div>Price Filter Controls (slider, input, etc.)</div>;
      default:
        return <div>Select a filter from sidebar.</div>;
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-muted-foreground">
          <FunnelPlusIcon /> {showText && "Filters"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[725px] p-0 gap-0 py-4">
        <DialogHeader className="px-4 mb-4">
          <DialogTitle>More Filters</DialogTitle>
          <DialogDescription>
            Tweak additional filters for your product search.
          </DialogDescription>
        </DialogHeader>

        {/* Main content: two vertical sections */}
        <div className="flex h-[330px]">
          {/* Sidebar: filter list */}
          <div className="flex flex-col gap-1 border-r bg-muted w-1/4">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                variant={selected === f.key ? "default" : "ghost"}
                className="justify-start rounded-none w-full px-4 py-3 text-left"
                onClick={() => setSelected(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          {/* Main: Filter Controls */}
          <div className="flex-1 px-2 flex h-full flex-col">
            <FilterSection type={selected} />
          </div>
        </div>

        {/* Footer: Cancel & Apply buttons */}
        <DialogFooter className="px-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" variant="default">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
