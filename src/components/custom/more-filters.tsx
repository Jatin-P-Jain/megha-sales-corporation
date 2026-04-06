"use client";

import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  FunnelPlus,
  FunnelPlusIcon,
  Loader2Icon,
  MousePointerClick,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import clsx from "clsx";
import {
  FilterSection,
  type FilterOptions,
  type FilterType,
} from "./filter-section";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { PRODUCT_STATUS } from "@/data/product-status";
import useIsMobile from "@/hooks/useIsMobile";
import Image from "next/image";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { useDrawerBackButton } from "@/hooks/useDrawerBackButton";

type FilterDef = FilterType;

const BASE_FILTERS: FilterDef[] = [
  { key: "brand", applyKey: "brandId", label: "Brand" },
  {
    key: "vehicleCompany",
    applyKey: "vehicleCompany",
    label: "Vehicle Company",
  },
  { key: "category", applyKey: "category", label: "Category" },
];

export default function MoreFilters({
  filterOptions,
  filterActive,
  isAdmin,
}: {
  filterOptions?: FilterOptions;
  filterActive?: boolean;
  isAdmin: boolean;
}) {
  const FILTERS = useMemo<FilterDef[]>(
    () =>
      isAdmin
        ? [
            ...BASE_FILTERS,
            { key: "status", applyKey: "status", label: "Status" },
          ]
        : BASE_FILTERS,
    [isAdmin],
  );
  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useDrawerBackButton(open, () => setOpen(false));

  const [selected, setSelected] = useState<FilterDef>(FILTERS[0]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [baseSelections, setBaseSelections] = useState<
    Record<string, string[]>
  >({});

  const isMobile = useIsMobile();

  const mergedFilterOptions = useMemo<FilterOptions | undefined>(() => {
    if (!filterOptions) return undefined;

    const selectedBrandIds = selections.brand || [];

    const selectedBrands = filterOptions.brands.filter((b) =>
      selectedBrandIds.includes(b.id),
    );

    const extraVehicleCompanies = selectedBrands.flatMap(
      (b) => b.vehicleCompanies ?? [],
    );

    const extraCategories = selectedBrands.flatMap((b) => b.categories ?? []);

    const vehicleCompanies = Array.from(
      new Set(
        [
          ...(filterOptions.vehicleCompanies ?? []),
          ...extraVehicleCompanies,
        ].filter(Boolean),
      ),
    );

    const categories = Array.from(
      new Set(
        [...(filterOptions.categories ?? []), ...extraCategories].filter(
          Boolean,
        ),
      ),
    );

    return {
      ...filterOptions,
      vehicleCompanies,
      categories,
    };
  }, [filterOptions, selections.brand]);

  // keep selected valid
  useEffect(() => {
    setSelected(
      (prev) => FILTERS.find((f) => f.key === prev.key) ?? FILTERS[0],
    );
  }, [FILTERS]);

  // on close after apply/clear
  useEffect(() => {
    if (!isPending && pendingKey !== null) {
      setOpen(false);
      setPendingKey(null);
    }
  }, [isPending, pendingKey]);

  // init on open
  useEffect(() => {
    if (!open) return;

    const nextSelections: Record<string, string[]> = {};
    FILTERS.forEach(({ key, applyKey }) => {
      const v = searchParams.get(applyKey);
      nextSelections[key] = v ? v.split(",").filter(Boolean) : [];
    });

    setSelections(nextSelections);
    setBaseSelections(nextSelections); // ✅ snapshot for "applied" styling
    setSelected(FILTERS[0]);
  }, [open, searchParams, FILTERS]);

  const toggleSelection = (filterKey: string, value: string) => {
    setSelections((sel) => {
      const current = sel[filterKey] || [];
      return current.includes(value)
        ? { ...sel, [filterKey]: current.filter((v) => v !== value) }
        : { ...sel, [filterKey]: [...current, value] };
    });
  };

  const selectedCountFor = useCallback(
    (key: string) => (selections[key] || []).filter(Boolean).length,
    [selections],
  );

  const selectedCountFromParams = useCallback(
    (applyKey: string) => {
      const v = searchParams.get(applyKey);
      return v ? v.split(",").filter(Boolean).length : 0;
    },
    [searchParams],
  );

  const optionItemsFor = useCallback(
    (
      key: FilterDef["key"],
    ): { value: string; label: string; logo?: string }[] => {
      if (!mergedFilterOptions) return [];

      if (key === "brand") {
        return (mergedFilterOptions.brands ?? []).map((b) => ({
          value: b.id,
          label: b.name,
          logo: b.logo,
        }));
      }

      if (key === "vehicleCompany") {
        return (mergedFilterOptions.vehicleCompanies ?? []).map((v) => ({
          value: v,
          label: v,
        }));
      }

      if (key === "category") {
        return (mergedFilterOptions.categories ?? []).map((c) => ({
          value: c,
          label: c,
        }));
      }

      if (key === "status") {
        return PRODUCT_STATUS.map((s) => ({
          value: s.value,
          label: s.label,
        }));
      }

      return [];
    },
    [mergedFilterOptions],
  );

  const currentValuesFromParams = useCallback(
    (applyKey: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      const current = params.get(applyKey);
      return current ? current.split(",").filter(Boolean) : [];
    },
    [searchParams],
  );

  const applyToggleFilter = useCallback(
    (applyKey: string, value: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      const current = currentValuesFromParams(applyKey);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      if (next.length > 0) {
        params.set(applyKey, next.join(","));
      } else {
        params.delete(applyKey);
      }

      params.set("page", "1");
      startTransition(() => {
        router.replace(`/products-list?${params.toString()}`);
      });
    },
    [currentValuesFromParams, router, searchParams],
  );

  const clearFilterKey = useCallback(
    (applyKey: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete(applyKey);
      params.set("page", "1");
      startTransition(() => {
        router.replace(`/products-list?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  function onApply() {
    setPendingKey("apply");
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    FILTERS.forEach(({ key, applyKey }) => {
      const vals = selections[key] || [];
      if (vals.length > 0) params.set(applyKey, vals.join(","));
      else params.delete(applyKey);
    });

    params.set("page", "1");

    startTransition(() => {
      router.replace(`/products-list?${params.toString()}`);
    });
  }

  function onClearAll() {
    setPendingKey("close");
    startTransition(() => {
      router.replace("/products-list?page=1");
    });
  }

  const TriggerButton = (
    <Button
      variant="ghost"
      className={clsx(
        "w-auto flex-1 font-normal",
        filterActive && "text-primary border-none font-medium shadow-none",
      )}
    >
      <FunnelPlusIcon /> Filters
    </Button>
  );

  const DesktopBody = (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 pb-1">
      {FILTERS.map((f) => {
        const options = optionItemsFor(f.key);
        const selectedValues = currentValuesFromParams(f.applyKey);
        const count = selectedCountFromParams(f.applyKey);
        const hasSelections = count > 0;
        const summary =
          count === 0
            ? f.label
            : count === 1
              ? `${f.label}: ${(options.find((o) => o.value === selectedValues[0]) || { label: "Selected" }).label}`
              : `${f.label} (${count})`;

        return (
          <Popover key={f.key}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size={"sm"}
                className={clsx(
                  "justify-center text-xs",
                  hasSelections &&
                    "border-primary bg-primary/10 text-primary font-medium",
                )}
              >
                <span className="truncate">{summary}</span>
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <div className="flex w-full flex-1 items-center">
                  {/* <Search className="text-muted-foreground mr-2 size-4" /> */}
                  <CommandInput
                    placeholder={`Search ${f.label.toLowerCase()}...`}
                    className="flex-1"
                  />
                </div>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup className="max-h-56 overflow-auto">
                  {options.map((o) => {
                    const isChecked = selectedValues.includes(o.value);
                    return (
                      <CommandItem
                        key={o.value}
                        value={o.label}
                        onSelect={() => {
                          applyToggleFilter(f.applyKey, o.value);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center gap-2">
                          <Checkbox checked={isChecked} />
                          {o?.logo && (
                            <Image
                              src={imageUrlFormatter(o.logo)}
                              alt={o.label}
                              width={32}
                              height={32}
                              className="size-8 rounded-sm object-contain"
                            />
                          )}
                          <span className="truncate">{o.label}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <div className="border-t p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => clearFilterKey(f.applyKey)}
                    disabled={!hasSelections}
                  >
                    Clear {f.label}
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        );
      })}
      {isPending && (
        <Loader2Icon className="text-muted-foreground size-4 animate-spin self-center" />
      )}
    </div>
  );

  const MobileBody = (
    <>
      <DrawerHeader className="shrink-0 px-4">
        <DrawerTitle className="text-lg">
          <FunnelPlus className="mr-2 mb-1 inline-flex size-5" />
          Filters
        </DrawerTitle>
        <DrawerDescription className="text-xs!">
          {filterActive
            ? "You have active filters. Apply or clear them below."
            : "Select filters to apply to your product search."}
        </DrawerDescription>
      </DrawerHeader>

      <div className="shrink-0 px-4 pb-3">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => {
            const c = selectedCountFor(f.key);
            const isSelected = selected.key === f.key;
            const hasSelections = c > 0;

            return (
              <Button
                key={f.key}
                variant={isSelected ? "default" : "outline"}
                type="button"
                size={"sm"}
                onClick={() => setSelected(f)}
                className={clsx(
                  hasSelections &&
                    !isSelected &&
                    "bg-primary/10 text-primary border-primary border",
                  "text-xs",
                )}
              >
                <span>{f.label}</span>
                {c > 0 && <span>({c})</span>}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="bg-muted flex min-h-0 flex-1 flex-col rounded-md mx-4">
        <FilterSection
          filterType={selected}
          selections={selections}
          setSelections={setSelections}
          filterOptions={mergedFilterOptions}
          toggleSelection={toggleSelection}
          baseSelections={baseSelections}
        />
      </div>

      <DrawerFooter className="flex w-full shrink-0 flex-row">
        <Button
          variant="outline"
          className="border-primary text-primary"
          onClick={onClearAll}
          disabled={isPending && pendingKey === "close"}
        >
          {isPending && pendingKey === "close" ? (
            <div className="flex justify-center gap-4">
              <span>Clearing all filters</span>
              <Loader2Icon className="size-4 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <X className="size-4" />
              <span>Clear</span>
            </div>
          )}
        </Button>

        <Button
          type="button"
          className="flex-1"
          onClick={onApply}
          disabled={isPending && pendingKey === "apply"}
        >
          {isPending && pendingKey === "apply" ? (
            <div className="flex justify-center gap-4">
              <span>Applying filters</span>
              <Loader2Icon className="size-4 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Apply</span>
              <MousePointerClick className="size-5" />
            </div>
          )}
        </Button>
      </DrawerFooter>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh] overflow-hidden">
          {MobileBody}
        </DrawerContent>
      </Drawer>
    );
  }
  return DesktopBody;
}
