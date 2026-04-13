"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceFilterSection } from "./price-filter-section";
import { DiscountFilterSection } from "./discount-filter-section";
import { PRODUCT_STATUS } from "@/data/product-status";
import clsx from "clsx";
import Image from "next/image";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { Info } from "lucide-react";

export interface FilterType {
  key: string;
  applyKey: string;
  label: string;
}

export interface FilterOptions {
  prices: { min: number; max: number };
  discount: { min: number; max: number };
  brands: Array<{
    id: string;
    name: string;
    logo: string;
    categories: string[];
    vehicleCompanies?: string[];
  }>;
  vehicleCompanies: string[];
  categories: string[];
  statuses?: Array<{
    label: string;
    value: string;
  }>;
}

interface FilterSectionProps {
  filterType: FilterType;
  filterOptions?: FilterOptions;
  selections: Record<string, string[]>;
  setSelections: (
    fn: (sel: Record<string, string[]>) => Record<string, string[]>,
  ) => void;
  toggleSelection: (key: string, value: string) => void;

  // ✅ new: baseline selections captured from URL when dialog/drawer opened
  baseSelections?: Record<string, string[]>;
}

export function FilterSection({
  filterType,
  filterOptions,
  selections,
  setSelections,
  toggleSelection,
  baseSelections,
}: FilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => setSearchTerm(""), [filterType.key]);

  const statusValueToLabel = useMemo(
    () =>
      Object.fromEntries(
        PRODUCT_STATUS.map((o) => [o.value, o.label] as const),
      ),
    [],
  );

  if (!filterOptions) return <div>Loading filters...</div>;

  // price
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

  // discount
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
  const baseValues = baseSelections?.[filterType.key] || [];
  const lower = searchTerm.toLowerCase();

  const brandOptionsArray = filterOptions.brands.map((b) => ({
    key: b.id,
    name: b.name,
    logo: b.logo,
  }));

  const optionsMap: Record<string, string[]> = {
    vehicleCompany: filterOptions.vehicleCompanies,
    category: filterOptions.categories,
  };

  const statusOptions = PRODUCT_STATUS.filter((s) =>
    s.label.toLowerCase().includes(lower),
  ).map((s) => s.value);

  const brandOptions = brandOptionsArray.filter((opt) =>
    opt.name.toLowerCase().includes(lower),
  );
  const otherOptions =
    filterType.key === "status"
      ? statusOptions
      : (optionsMap[filterType.key] || []).filter((opt) =>
          opt.toLowerCase().includes(lower),
        );

  const nothingFound =
    filterType.key === "brand"
      ? brandOptions.length === 0
      : otherOptions.length === 0;

  function checkboxToneClass(value: string) {
    const checked = selectedValues.includes(value);
    if (!checked) return "";
    const wasApplied = baseValues.includes(value);
    // muted for applied-from-URL, primary for new selection
    return wasApplied
      ? "data-[state=checked]:border-muted-foreground data-[state=checked]:bg-muted-foreground/40"
      : "data-[state=checked]:border-primary data-[state=checked]:bg-primary";
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 p-4">
      {filterType.key !== "brand" && (
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground flex items-center gap-1 text-[10px]">
            <Info className="size-3" />
            Showing {filterType.label} options for the selected brands only.
          </h3>
        </div>
      )}
      <Input
        placeholder={`Search ${filterType.label}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto overscroll-contain">
        {nothingFound && (
          <div className="text-xs">
            No {filterType.label} with name &quot;
            <span className="font-semibold">{searchTerm}</span>
            &quot; found.
          </div>
        )}

        {filterType.key === "brand"
          ? brandOptions.map((opt) => {
              const checked = selectedValues.includes(opt.key);
              const wasApplied = baseValues.includes(opt.key);

              return (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      toggleSelection(filterType.key, opt.key)
                    }
                    className={clsx(
                      "size-5 cursor-pointer",
                      checkboxToneClass(opt.key),
                    )}
                  />
                  <div className="h-10 w-10">
                    <Image
                      src={imageUrlFormatter(opt.logo)}
                      alt={opt.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span
                    className={clsx(
                      wasApplied && checked ? "text-muted-foreground" : "",
                    )}
                  >
                    {opt.name}
                  </span>
                </label>
              );
            })
          : otherOptions.map((opt) => {
              const checked = selectedValues.includes(opt);
              const wasApplied = baseValues.includes(opt);

              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleSelection(filterType.key, opt)}
                    className={clsx(
                      "size-5 cursor-pointer",
                      checkboxToneClass(opt),
                    )}
                  />
                  <span
                    className={clsx(
                      wasApplied && checked ? "text-muted-foreground" : "",
                    )}
                  >
                    {filterType.key === "status"
                      ? (statusValueToLabel[opt] ?? opt)
                      : opt}
                  </span>
                </label>
              );
            })}
      </div>
    </div>
  );
}
