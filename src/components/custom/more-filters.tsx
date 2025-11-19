"use client";

import { useState, useEffect, useTransition } from "react";
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
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { PriceFilterSection } from "./price-filter-section";
import { DiscountFilterSection } from "./discount-filter-section";

const FILTERS = [
  { key: "brand", applyKey: "brandId", label: "Brand" },
  {
    key: "vehicleCompany",
    applyKey: "vehicleCompany",
    label: "Vehicle Company",
  },
  { key: "category", applyKey: "category", label: "Category" },
  { key: "price", applyKey: "price", label: "Price" },
  { key: "discount", applyKey: "discount", label: "Discount" },
];

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
  useEffect(() => {
    if (!isPending && pendingKey !== null) {
      setOpen(false);
      setPendingKey(null);
    }
  }, [isPending, pendingKey]);

  // Track which sidebar filter is selected
  const [selected, setSelected] = useState(FILTERS[0]);

  // Track checked items for each logical filter key, e.g.
  // selections.brand, selections.vehicleCompany, ...
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) {
      const newSelections: Record<string, string[]> = {};
      FILTERS.forEach(({ key, applyKey }) => {
        const paramValue = searchParams.get(applyKey);
        if (paramValue) {
          newSelections[key] = paramValue.split(",");
        } else {
          newSelections[key] = [];
        }
      });
      setSelections(newSelections);
      setSelected(FILTERS[0]);
    }
  }, [open, searchParams || ""]);

  // When URL params change, update initial checkboxes
  useEffect(() => {
    const newSelections: Record<string, string[]> = {};
    FILTERS.forEach(({ key, applyKey }) => {
      // Map brandId param to brand selection, others are 1:1
      const paramValue = searchParams.get(applyKey);
      if (paramValue) {
        newSelections[key] = paramValue.split(",");
      } else {
        newSelections[key] = [];
      }
    });
    setSelections(newSelections);
  }, [searchParams]);

  // Sidebar highlight if param for applyKey exists
  const isFilterActive = (filter: (typeof FILTERS)[0]) =>
    !!searchParams.get(filter.applyKey)?.length;

  // Toggle checkbox for a filter/option (uses filter.key internally)
  const toggleSelection = (filterKey: string, value: string) => {
    setSelections((sel) => {
      const current = sel[filterKey] || [];
      if (current.includes(value)) {
        return {
          ...sel,
          [filterKey]: current.filter((v) => v !== value),
        };
      } else {
        return {
          ...sel,
          [filterKey]: [...current, value],
        };
      }
    });
  };

  // The content for current filter section
  function FilterSection({
    filterType,
  }: {
    filterType: { key: string; applyKey: string; label: string };
  }) {
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => setSearchTerm(""), [filterType.key]);

    if (!filterOptions) return <div>Loading filters...</div>;

    // Handle price specially
    if (filterType.key === "price") {
      const [currentMinPrice, currentMaxPrice] = selections[filterType.key];
      const min = parseInt(currentMinPrice) || filterOptions.prices.min;
      const max = parseInt(currentMaxPrice) || filterOptions.prices.max;

      return (
        <PriceFilterSection
          min={min}
          max={max}
          // currentSelection={currentPriceSelection}
          onPriceChange={(minPrice, maxPrice) => {
            // Store as "minPrice,maxPrice" format
            setSelections((sel) => ({
              ...sel,
              [filterType.key]: [`${minPrice},${maxPrice}`],
            }));
          }}
        />
      );
    }
    if (filterType.key === "discount") {
      const [currentMinDiscount, currentMaxDiscount] =
        selections[filterType.key];
      const min = parseInt(currentMinDiscount) || filterOptions.discount.min;
      const max = parseInt(currentMaxDiscount) || filterOptions.discount.max;

      return (
        <DiscountFilterSection
          min={min}
          max={max}
          // currentSelection={currentPriceSelection}
          onDiscountChange={(minDiscount, maxDiscount) => {
            // Store as "minDiscount,maxDiscount" format
            setSelections((sel) => ({
              ...sel,
              [filterType.key]: [`${minDiscount},${maxDiscount}`],
            }));
          }}
        />
      );
    }

    // All other types: fetch options
    const brandOptionsArray: { key: string; name: string }[] =
      filterOptions.brands.map((b) => ({ key: b.id, name: b.name }));

    const optionsMap: Record<string, string[]> = {
      vehicleCompany: filterOptions.vehicleCompanies,
      category: filterOptions.categories,
    };

    // Show only those that match the searchTerm, case-insensitive
    const brandOptions = brandOptionsArray.filter((opt) =>
      opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const otherOptions = (optionsMap[filterType.key] || []).filter((opt) =>
      opt.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // The checked values for this type
    const selectedValues = selections[filterType.key] || [];

    return (
      <div className="flex h-full w-full flex-col gap-2 p-4">
        <Input
          placeholder={`Search ${filterType.label}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className=""
        />
        <div className="flex h-full flex-col gap-2 overflow-auto">
          {brandOptions.length === 0 && otherOptions.length === 0 && (
            <div className="text-xs">
              No {filterType.label} with name &quot;
              <span className="font-semibold">{searchTerm}</span>
              &quot; found.
            </div>
          )}
          {filterType.key === "brand"
            ? brandOptions.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={selectedValues.includes(opt.key)}
                    onClick={() => toggleSelection(filterType.key, opt.key)}
                    className="size-5 cursor-pointer"
                  />
                  <span>{opt.name}</span>
                </label>
              ))
            : otherOptions.map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={selectedValues.includes(opt)}
                    onClick={() => toggleSelection(filterType.key, opt)}
                    className="size-5 cursor-pointer"
                  />
                  <span>{opt}</span>
                </label>
              ))}
        </div>
      </div>
    );
  }

  // When apply is pressed, write all filters (mapping "brand" to "brandId" param)
  function onApply() {
    setPendingKey("apply");
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    FILTERS.forEach(({ key, applyKey }) => {
      const vals = selections[key] || [];
      if (vals.length > 0) {
        params.set(applyKey, vals.join(","));
      } else {
        params.delete(applyKey);
      }
    });
    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  }

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
          {filterActive && (
            <span className="bg-primary size-2 rounded-full"></span>
          )}
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
          {/* Sidebar */}
          <div className="flex flex-col gap-1 md:w-[45%]">
            {FILTERS.map((f) => {
              const paramValue = searchParams.get(f.applyKey);
              const isApplied =
                paramValue && paramValue?.split(",")?.length >= 1;
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
                    ></span>
                  )}
                </Button>
              );
            })}
          </div>
          {/* Filter content */}
          <div className="flex h-full w-full p-4 pt-0 pl-0">
            <div className="bg-muted flex h-full w-full flex-col rounded-md">
              <FilterSection filterType={selected} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex w-full gap-2 px-4">
          <Button
            variant="outline"
            className="border-primary text-primary w-full flex-1"
            // Add clear here if you want to clear all filters!
            onClick={() => {
              setPendingKey("close");
              startTransition(() => {
                router.replace("/products-list");
              });
            }}
            disabled={isPending && pendingKey == "close"}
          >
            {isPending && pendingKey == "close" ? (
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
