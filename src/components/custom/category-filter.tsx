"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Loader2Icon } from "lucide-react";
import clsx from "clsx";
import { Badge } from "../ui/badge";

type CategorySelectProps = {
  categories: string[];
};

export default function CategoryMultiSelect({
  categories,
}: CategorySelectProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // read selected
  const selected = params.get("category") || "";
  const currentSelections = selected.split(",").filter((c) => c);
  // toggle handler
  function toggle(cat: string) {
    setPendingKey(cat);
    const qp = new URLSearchParams(Array.from(params.entries()));
    const next = currentSelections.includes(cat)
      ? currentSelections.filter((c) => c !== cat)
      : [...currentSelections, cat];

    qp.delete("category");
    if (next.length > 0) {
      qp.set("category", next.join(","));
    }
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/products-list?${qp.toString()}`, { scroll: false });
    });
  }

  // clear pendingKey
  useEffect(() => {
    if (!isPending) setPendingKey(null);
  }, [isPending]);

  return (
    <Popover>
      <div
        className={clsx(
          "flex items-center justify-start rounded-md border-1 border-dashed",
          selected.length > 0 && "pr-2",
        )}
      >
        <PopoverTrigger asChild className="">
          <Button
            variant="ghost"
            className={clsx(
              "min-w-0 shrink-0 items-center justify-between gap-1 rounded-none hover:bg-transparent",
              selected.length > 0 && "border-r-1",
            )}
            ref={triggerRef}
          >
            {/* truncate here */}
            <span
              className={clsx("text-xs md:text-sm", selected.length == 0 && "")}
            >
              Category
            </span>
            {isPending && pendingKey !== null && (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            )}
            <ChevronDown className="" />
          </Button>
        </PopoverTrigger>
        <div className="no-scrollbar flex overflow-auto">
          {currentSelections.length > 0 &&
            currentSelections.map((s, i) => {
              return (
                <Badge
                  key={i}
                  className="bg-primary-foreground text-primary border-primary ml-2 flex h-fit border-1 py-1 text-[8px] md:text-xs"
                >
                  {s}
                </Badge>
              );
            })}
        </div>
      </div>

      {/* fixed width popover */}
      <PopoverContent
        className="p-0"
        collisionBoundary={
          typeof document !== "undefined" ? [document.body] : []
        }
        collisionPadding={8}
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={true}
      >
        <Command>
          {/* full-width input */}
          <CommandInput className="w-full" placeholder="Search categories..." />
          <CommandEmpty>No categories found.</CommandEmpty>
          <CommandGroup className="max-h-35 overflow-auto">
            {categories?.map((cat) => {
              const isSel = selected.includes(cat);
              const thisPending = pendingKey === cat && isPending;
              return (
                <CommandItem
                  key={cat}
                  onSelect={() => toggle(cat)}
                  className="flex items-center justify-between"
                >
                  <span>{cat}</span>
                  {thisPending ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Checkbox checked={isSel} />
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
