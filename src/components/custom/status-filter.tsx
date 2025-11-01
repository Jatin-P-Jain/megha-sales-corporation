"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Loader2Icon } from "lucide-react";
import clsx from "clsx";
import { PRODUCT_STATUS } from "@/data/product-status";
import { Badge } from "../ui/badge";

type StatusSelectProps = {
  handleFiltersApplied?: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function StatusSelect({
  handleFiltersApplied,
}: StatusSelectProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // read selected
  const selected = params.getAll("status");

  // toggle handler
  function toggle(status: string) {
    setPendingKey(status);
    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.delete("status");
    const next = selected.includes(status)
      ? selected.filter((s) => s !== status)
      : [...selected, status];
    next.forEach((s) => qp.append("status", s));

    if (next.length > 0 && handleFiltersApplied) {
      handleFiltersApplied(true);
    } else {
      handleFiltersApplied && handleFiltersApplied(false);
    }
    qp.set("page", "1");

    startTransition(() => {
      router.push(`/products-list?${qp}`, { scroll: false });
    });
  }

  // clear pendingKey
  useEffect(() => {
    if (!isPending) setPendingKey(null);
  }, [isPending]);

  const valueToLabel = Object.fromEntries(
    PRODUCT_STATUS.map((o) => [o.value, o.label] as const),
  );

  return (
    <Popover>
      <div
        className={clsx(
          "flex items-center justify-start rounded-md border-1 border-dashed " ,
          selected.length > 0 && "pr-2",
        )}
      >
        <PopoverTrigger asChild className="">
          <Button
            variant="ghost"
            className={clsx(
              "min-w-0 items-center justify-between gap-1 rounded-none hover:bg-transparent",
              selected.length > 0 && "border-r-1",
            )}
            ref={triggerRef}
          >
            {/* truncate here */}
            <span className={clsx("", selected.length == 0 && "")}>Status</span>
            {isPending && pendingKey !== null && (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            )}
            <ChevronDown className="" />
          </Button>
        </PopoverTrigger>
        <div className="no-scrollbar flex overflow-x-auto">
          {selected.length > 0 &&
            selected.map((s,i) => {
              return (
                <Badge key={i} className="bg-primary-foreground text-primary border-primary ml-2 flex h-fit border-1 py-1 text-[8px] md:text-xs">
                  {valueToLabel[s] ?? s}
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
          <CommandGroup className="max-h-35 overflow-auto">
            {PRODUCT_STATUS.map(({ label, value }) => {
              const isSel = selected.includes(value);
              const thisPending = pendingKey === value && isPending;
              return (
                <CommandItem
                  key={value}
                  onSelect={() => toggle(value)}
                  className="flex items-center justify-between"
                >
                  <span>{label}</span>
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
