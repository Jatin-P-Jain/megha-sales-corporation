"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceFilterSection } from "./price-filter-section";
import { DiscountFilterSection } from "./discount-filter-section";

interface FilterType {
  key: string;
  applyKey: string;
  label: string;
}

interface FilterOptions {
  prices: { min: number; max: number };
  discount: { min: number; max: number };
  brands: Array<{ id: string; name: string }>;
  vehicleCompanies: string[];
  categories: string[];
}

interface FilterSectionProps {
  filterType: FilterType;
  filterOptions?: FilterOptions;
  selections: Record<string, string[]>;
  setSelections: (
    fn: (sel: Record<string, string[]>) => Record<string, string[]>,
  ) => void;
  toggleSelection: (key: string, value: string) => void;
}

export function FilterSection({
  filterType,
  filterOptions,
  selections,
  setSelections,
  toggleSelection,
}: FilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => setSearchTerm(""), [filterType.key]);

  if (!filterOptions) return <div>Loading filters...</div>;

  // Handle price specially: selections.price = ["min,max"]
  if (filterType.key === "price") {
    const raw = selections[filterType.key]?.[0] ?? "";
    const [rawMin, rawMax] = raw.split(",");
    const min = rawMin ? parseInt(rawMin, 10) : filterOptions.prices.min;
    const max = rawMax ? parseInt(rawMax, 10) : filterOptions.prices.max;

    return (
      <PriceFilterSection
        min={Number.isFinite(min) ? min : filterOptions.prices.min}
        max={Number.isFinite(max) ? max : filterOptions.prices.max}
        onPriceChange={(minPrice, maxPrice) => {
          setSelections((sel) => ({
            ...sel,
            [filterType.key]: [`${minPrice},${maxPrice}`],
          }));
        }}
      />
    );
  }

  // Handle discount specially: selections.discount = ["min,max"]
  if (filterType.key === "discount") {
    const raw = selections[filterType.key]?.[0] ?? "";
    const [rawMin, rawMax] = raw.split(",");
    const min = rawMin ? parseInt(rawMin, 10) : filterOptions.discount.min;
    const max = rawMax ? parseInt(rawMax, 10) : filterOptions.discount.max;

    return (
      <DiscountFilterSection
        min={Number.isFinite(min) ? min : filterOptions.discount.min}
        max={Number.isFinite(max) ? max : filterOptions.discount.max}
        onDiscountChange={(minDiscount, maxDiscount) => {
          setSelections((sel) => ({
            ...sel,
            [filterType.key]: [`${minDiscount},${maxDiscount}`],
          }));
        }}
      />
    );
  }

  const selectedValues = selections[filterType.key] || [];
  const lower = searchTerm.toLowerCase();

  // Options
  const brandOptionsArray = filterOptions.brands.map((b) => ({
    key: b.id,
    name: b.name,
  }));

  const optionsMap: Record<string, string[]> = {
    vehicleCompany: filterOptions.vehicleCompanies,
    category: filterOptions.categories,
  };

  const brandOptions = brandOptionsArray.filter((opt) =>
    opt.name.toLowerCase().includes(lower),
  );

  const otherOptions = (optionsMap[filterType.key] || []).filter((opt) =>
    opt.toLowerCase().includes(lower),
  );

  const nothingFound =
    filterType.key === "brand"
      ? brandOptions.length === 0
      : otherOptions.length === 0;

  return (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      <Input
        placeholder={`Search ${filterType.label}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex h-full flex-col gap-2 overflow-auto">
        {nothingFound && (
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
                  onCheckedChange={() =>
                    toggleSelection(filterType.key, opt.key)
                  }
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
                  onCheckedChange={() => toggleSelection(filterType.key, opt)}
                  className="size-5 cursor-pointer"
                />
                <span>{opt}</span>
              </label>
            ))}
      </div>
    </div>
  );
}
