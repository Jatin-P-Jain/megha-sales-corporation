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
  FunnelPlusIcon,
  Loader2Icon,
  MousePointerClick,
  X,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import {
  FilterSection,
  type FilterOptions,
  type FilterType,
} from "./filter-section";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { PRODUCT_STATUS } from "@/data/product-status";
import useIsMobile from "@/hooks/useIsMobile";

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

  const [selected, setSelected] = useState<FilterDef>(FILTERS[0]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [baseSelections, setBaseSelections] = useState<
    Record<string, string[]>
  >({});

  const isMobile = useIsMobile();

  const mergedFilterOptions = useMemo<FilterOptions | undefined>(() => {
    if (!filterOptions) return undefined;

    const statusValues =
      filterOptions.statuses ?? PRODUCT_STATUS.map((s) => s.value);

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
      statuses: statusValues,
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
      variant="outline"
      className={clsx(
        "relative w-auto flex-1 font-normal",
        filterActive && "border-primary text-primary border-2 font-medium",
      )}
    >
      <FunnelPlusIcon /> Filters
      {filterActive && <span className="bg-primary size-2 rounded-full" />}
    </Button>
  );

  const DesktopBody = (
    <>
      <DialogHeader className="mb-4 px-4">
        <DialogTitle>More Filters</DialogTitle>
        <DialogDescription>
          Tweak additional filters for your product search.
        </DialogDescription>
      </DialogHeader>

      <div className="flex h-[330px] gap-4">
        <div className="flex flex-col gap-1 md:w-[45%]">
          {FILTERS.map((f) => {
            const c = selectedCountFor(f.key);
            return (
              <Button
                key={f.key}
                variant={
                  selected.key === f.key
                    ? "default"
                    : c > 0
                      ? "secondary"
                      : "ghost"
                }
                className={clsx(
                  "bg-primary/20 w-full justify-between rounded-none rounded-r-xl px-4 py-3 text-left text-sm",
                  selected.key === f.key && "bg-primary",
                )}
                onClick={() => setSelected(f)}
              >
                <span className="text-wrap">
                  {f.label} {c > 0 ? `(${c})` : ""}
                </span>
                {c > 0 && (
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
              filterOptions={mergedFilterOptions}
              toggleSelection={toggleSelection}
              baseSelections={baseSelections}
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
    </>
  );

  const MobileBody = (
    <>
      <DrawerHeader className="px-4">
        <DrawerTitle>More Filters</DrawerTitle>
        <DrawerDescription>
          Tweak additional filters for your product search.
        </DrawerDescription>
      </DrawerHeader>

      <div className="px-4 pb-3">
        <Select
          value={selected.key}
          onValueChange={(v) => {
            const next = FILTERS.find((f) => f.key === v);
            if (next) setSelected(next);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => {
              const c = selectedCountFor(f.key);
              return (
                <SelectItem key={f.key} value={f.key}>
                  {f.label} {c > 0 ? `(${c} selections)` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="px-4">
        <div className="bg-muted overflow-auto rounded-md">
          <FilterSection
            filterType={selected}
            selections={selections}
            setSelections={setSelections}
            filterOptions={mergedFilterOptions}
            toggleSelection={toggleSelection}
            baseSelections={baseSelections}
          />
        </div>
      </div>

      <DrawerFooter className="flex w-full flex-row">
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
        <DrawerContent className="max-h-[90vh]">{MobileBody}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="gap-0 p-0 py-4 sm:max-w-[725px]">
        {DesktopBody}
      </DialogContent>
    </Dialog>
  );
}
