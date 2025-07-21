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
import { ChevronDown, CircleXIcon, Loader2Icon } from "lucide-react";
import clsx from "clsx";

export default function CategoryMultiSelect({
  categories,
}: {
  categories: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // read selected
  const selected = params.getAll("category");

  // toggle handler
  function toggle(cat: string) {
    setPendingKey(cat);
    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("category");
    const next = selected.includes(cat)
      ? selected.filter((c) => c !== cat)
      : [...selected, cat];
    next.forEach((c) => qp.append("category", c));
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/products-list?${qp}`, { scroll: false });
    });
  }

  // clear pendingKey
  useEffect(() => {
    if (!isPending) setPendingKey(null);
  }, [isPending]);

  // label text
  const label = selected.length ? selected.join(", ") : "Part Categories";

  return (
    <Popover>
      <PopoverTrigger asChild className="">
        <div
          className={
            clsx(
              "grid grid-cols-1 items-center justify-between gap-2",
              selected.length > 0 && "grid-cols-[12fr_1fr]"
            )
          }
        >
          <Button
            variant="outline"
            className="flex w-full min-w-0 items-center justify-between gap-2"
            ref={triggerRef}
          >
            {/* truncate here */}
            <span
              className={clsx(
                "min-w-0 flex-1 truncate",
                selected.length == 0 && "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {isPending && pendingKey !== null && (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            )}
            <ChevronDown className="text-muted-foreground" />
          </Button>
          {selected.length > 0 && (
            <Button
              variant="outline"
              className=""
              onClick={() => {
                // clear all categories
                const qp = new URLSearchParams(Array.from(params.entries()));
                qp.delete("category");
                qp.set("page", "1");
                startTransition(() => {
                  router.push(`/products-list?${qp}`, { scroll: false });
                });
              }}
            >
              <CircleXIcon className="text-muted-foreground size-5" />
            </Button>
          )}
        </div>
      </PopoverTrigger>

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
            {categories.map((cat) => {
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
