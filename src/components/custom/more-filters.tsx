"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelPlusIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import clsx from "clsx";
import { FilterOptions } from "@/types/filterOptions";
import { FilterSection } from "./filter-section";

const FILTERS = [
  { key: "brand", applyKey: "brandId", label: "Brand" },
  {
    key: "vehicleCompany",
    applyKey: "vehicleCompany",
    label: "Vehicle Company",
  },
] as const;

export default function MoreFilters({
  filterOptions,
  filterActive,
  showText = true,
}: {
  filterOptions?: FilterOptions;
  filterActive?: boolean;
  showText?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const [selected, setSelected] = useState<(typeof FILTERS)[number]>(
    FILTERS[0],
  );
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isPending && pendingKey !== null) {
      setOpen(false);
      setPendingKey(null);
    }
  }, [isPending, pendingKey]);

  // When dialog opens, initialize selections from URL once
  useEffect(() => {
    if (!open) return;

    const nextSelections: Record<string, string[]> = {};
    FILTERS.forEach(({ key, applyKey }) => {
      const v = searchParams.get(applyKey);
      nextSelections[key] = v ? v.split(",").filter(Boolean) : [];
    });

    setSelections(nextSelections);
    setSelected(FILTERS[0]);
  }, [open, searchParams]);

  const isFilterActive = useCallback(
    (filter: (typeof FILTERS)[number]) =>
      !!searchParams.get(filter.applyKey)?.length,
    [searchParams],
  );

  const toggleSelection = (filterKey: string, value: string) => {
    setSelections((sel) => {
      const current = sel[filterKey] || [];
      return current.includes(value)
        ? { ...sel, [filterKey]: current.filter((v) => v !== value) }
        : { ...sel, [filterKey]: [...current, value] };
    });
  };

  function onApply() {
    setPendingKey("apply");

    const params = new URLSearchParams(Array.from(searchParams.entries()));

    FILTERS.forEach(({ key, applyKey }) => {
      const vals = selections[key] || [];
      if (vals.length > 0) params.set(applyKey, vals.join(","));
      else params.delete(applyKey);
    });

    // ✅ important: whenever filters change, reset page
    params.set("page", "1");

    startTransition(() => {
      router.replace(`/products-list?${params.toString()}`);
    });
  }

  const onClearAll = () => {
    setPendingKey("close");
    startTransition(() => {
      router.replace("/products-list?page=1");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={clsx(
            "text-muted-foreground relative",
            filterActive && "border-primary text-primary border-2",
          )}
        >
          <FunnelPlusIcon /> {showText && "Filters"}{" "}
          {filterActive && <span className="bg-primary size-2 rounded-full" />}
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 py-4 sm:max-w-[725px]">
        <DialogHeader className="mb-4 px-4">
          <DialogTitle>More Filters</DialogTitle>
          <DialogDescription>
            Tweak additional filters for your product search.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[330px] gap-4">
          <div className="flex flex-col gap-1 md:w-[45%]">
            {FILTERS.map((f) => {
              const paramValue = searchParams.get(f.applyKey);
              const isApplied = Boolean(paramValue?.split(",")?.length);
              return (
                <Button
                  key={f.key}
                  variant={
                    selected.key === f.key
                      ? "default"
                      : isFilterActive(f)
                        ? "secondary"
                        : "ghost"
                  }
                  className={clsx(
                    "bg-primary/20 w-full justify-between rounded-none rounded-r-xl px-4 py-3 text-left text-sm",
                    selected.key === f.key && "bg-primary",
                  )}
                  onClick={() => setSelected(f)}
                >
                  <span className="text-wrap">{f.label}</span>
                  {isApplied && (
                    <span
                      className={clsx(
                        "size-3 rounded-full",
                        selected.key === f.key ? "bg-white" : "bg-primary",
                      )}
                    />
                  )}
                </Button>
              );
            })}
          </div>

          <div className="flex h-full w-full p-4 pt-0 pl-0">
            <div className="bg-muted flex h-full w-full flex-col rounded-md">
              <FilterSection
                filterType={selected}
                selections={selections}
                setSelections={setSelections}
                filterOptions={filterOptions}
                toggleSelection={toggleSelection}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex w-full gap-2 px-4">
          <Button
            variant="outline"
            className="border-primary text-primary w-full flex-1"
            onClick={onClearAll}
            disabled={isPending && pendingKey === "close"}
          >
            {isPending && pendingKey === "close" ? (
              <div className="flex justify-center gap-4">
                <span>Clearing all filters</span>
                <Loader2Icon className="size-4 animate-spin" />
              </div>
            ) : (
              "Clear All"
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            className="w-full flex-1"
            onClick={onApply}
            disabled={isPending && pendingKey === "apply"}
          >
            {isPending && pendingKey === "apply" ? (
              <div className="flex justify-center gap-4">
                <span>Applying filters</span>
                <Loader2Icon className="size-4 animate-spin" />
              </div>
            ) : (
              "Apply Filters"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
