"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CircleXIcon, ClockIcon, FormInput, Loader2Icon } from "lucide-react";
import { useTransition, useState, useEffect, useMemo } from "react";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { firestore } from "@/firebase/client";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

export const STATUSES: { label: string; value: string }[] = [
  { label: "Pending", value: "pending" },
  { label: "Packing", value: "packing" },
  { label: "Dispatch", value: "dispatch" },
];

const ORDER_STATUS_PARAM = "orderStatus";
const FIRM_NAME_PARAM = "firmName";
const PAGE_PARAM = "page";

type PendingAction = "status" | "firm" | "clear" | null;

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function parseMultiParam(paramsKey: string, key: string) {
  return new URLSearchParams(paramsKey)
    .getAll(key)
    .map((v) => v.trim())
    .filter(Boolean);
}

function toggleItem(items: string[], item: string) {
  return items.includes(item)
    ? items.filter((value) => value !== item)
    : [...items, item];
}

function PopoverActions({
  onClear,
  onApply,
  disabled,
}: {
  onClear: () => void;
  onApply: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 border-t pt-2">
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" onClick={onApply} disabled={disabled}>
        Apply
      </Button>
    </div>
  );
}

export default function OrderFilters({ isAdmin }: { isAdmin: boolean }) {
  const router = useSafeRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [pendingStatus, setPendingStatus] = useState<PendingAction>(null);

  useEffect(() => {
    if (!isPending) {
      setPendingStatus(null);
    }
  }, [isPending]);

  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [firmPopoverOpen, setFirmPopoverOpen] = useState(false);
  const [firmNames, setFirmNames] = useState<string[]>([]);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [draftFirms, setDraftFirms] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const paramsKey = params.toString();

  const selected = useMemo(() => {
    return parseMultiParam(paramsKey, ORDER_STATUS_PARAM);
  }, [paramsKey]);

  const selectedFirms = useMemo(() => {
    return parseMultiParam(paramsKey, FIRM_NAME_PARAM);
  }, [paramsKey]);

  const selectedLabel = useMemo(() => {
    if (selected.length === 0) return "Order Status";
    if (selected.length === 1) {
      return STATUSES.find((s) => s.value === selected[0])?.label ?? "1 Status";
    }
    return `${selected.length} Statuses`;
  }, [selected]);

  const selectedFirmLabel = useMemo(() => {
    if (selectedFirms.length === 0) return "Firm Name";
    if (selectedFirms.length === 1) return "1 Firm Name";
    return `${selectedFirms.length} Firm Names`;
  }, [selectedFirms]);

  useEffect(() => {
    if (!firmPopoverOpen) return;
    setDraftFirms((prev) =>
      arraysEqual(prev, selectedFirms) ? prev : selectedFirms,
    );
  }, [firmPopoverOpen, selectedFirms]);

  useEffect(() => {
    if (!statusPopoverOpen) return;
    setDraftStatuses((prev) => (arraysEqual(prev, selected) ? prev : selected));
  }, [selected, statusPopoverOpen]);

  useEffect(() => {
    if (!isAdmin || !firmPopoverOpen || firmNames.length > 0) return;

    const loadFirmNames = async () => {
      try {
        setFirmsLoading(true);
        const q = query(
          collection(firestore, "orders"),
          orderBy("updatedAt", "desc"),
          limit(200),
        );
        const snap = await getDocs(q);
        const names = Array.from(
          new Set(
            snap.docs
              .map((d) =>
                (d.data()?.user?.firmName as string | undefined)?.trim(),
              )
              .filter((name): name is string => Boolean(name)),
          ),
        ).sort((a, b) => a.localeCompare(b));
        setFirmNames(names);
      } catch (err) {
        console.error("Failed to load firm names for filters", err);
      } finally {
        setFirmsLoading(false);
      }
    };

    void loadFirmNames();
  }, [firmPopoverOpen, firmNames.length, isAdmin]);

  const updateQuery = (mutate: (qp: URLSearchParams) => void) => {
    const qp = new URLSearchParams(Array.from(params.entries()));
    mutate(qp);
    qp.set(PAGE_PARAM, "1");
    startTransition(() => {
      router.push(`/order-history?${qp.toString()}`);
    });
  };

  function toggleDraftStatus(status: string) {
    setDraftStatuses((prev) => toggleItem(prev, status));
  }

  function applyStatuses() {
    setPendingStatus("status");
    updateQuery((qp) => {
      qp.delete(ORDER_STATUS_PARAM);
      draftStatuses.forEach((status) => qp.append(ORDER_STATUS_PARAM, status));
    });
    setStatusPopoverOpen(false);
  }

  function clearStatusFilter() {
    setPendingStatus("status");
    updateQuery((qp) => {
      qp.delete(ORDER_STATUS_PARAM);
    });
    setStatusPopoverOpen(false);
  }

  function clearStatuses() {
    setPendingStatus("clear");

    updateQuery((qp) => {
      qp.delete(ORDER_STATUS_PARAM);
      qp.delete(FIRM_NAME_PARAM);
    });
  }

  function toggleDraftFirmName(firmName: string) {
    setDraftFirms((prev) => toggleItem(prev, firmName));
  }

  function applyFirmNames() {
    setPendingStatus("firm");
    updateQuery((qp) => {
      qp.delete(FIRM_NAME_PARAM);
      draftFirms.forEach((name) => qp.append(FIRM_NAME_PARAM, name));
    });
    setFirmPopoverOpen(false);
  }

  function clearFirmDraft() {
    setDraftFirms([]);
  }

  function clearFirmFilter() {
    setPendingStatus("firm");
    updateQuery((qp) => {
      qp.delete(FIRM_NAME_PARAM);
    });
    setFirmPopoverOpen(false);
  }

  return (
    <div className={clsx("flex w-full items-center justify-start gap-0")}>
      <span className="text-muted-foreground mr-1 text-xs whitespace-nowrap md:text-sm">
        Filter By:
      </span>
      <div className="flex w-full items-center justify-end gap-1">
        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={clsx(
                "h-fit px-3 py-1.5 text-xs md:text-sm",
                selected.length > 0 && "border-primary text-primary",
              )}
            >
              <ClockIcon className="size-3" /> {selectedLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-fit p-3">
            <div className="flex flex-col gap-2">
              {STATUSES.map(({ label, value }) => {
                const checked = draftStatuses.includes(value);
                return (
                  <Label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleDraftStatus(value)}
                    />
                    <span className="text-sm">{label}</span>
                  </Label>
                );
              })}
            </div>
            <PopoverActions
              onClear={clearStatusFilter}
              onApply={applyStatuses}
              disabled={isPending}
            />
          </PopoverContent>
        </Popover>

        {isAdmin && (
          <>
            <Separator orientation="vertical" className="bg-muted h-8" />
            <Popover open={firmPopoverOpen} onOpenChange={setFirmPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={clsx(
                    "h-fit py-1.5 text-xs md:text-sm",
                    selectedFirms.length > 0 && "border-primary text-primary",
                  )}
                >
                  <FormInput className="size-3" />
                  {selectedFirmLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <div className="text-muted-foreground mb-2 text-xs">
                  Select firm names to filter orders.
                </div>
                <ScrollArea className="max-h-56 rounded-md border p-2">
                  <div className="flex flex-col gap-2">
                    <Label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={draftFirms.length === 0}
                        onCheckedChange={() => clearFirmDraft()}
                      />
                      <span className="text-sm">All firms</span>
                    </Label>

                    {firmsLoading ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                        Loading firms...
                      </div>
                    ) : (
                      firmNames.map((name) => (
                        <Label
                          key={name}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Checkbox
                            checked={draftFirms.includes(name)}
                            onCheckedChange={() => toggleDraftFirmName(name)}
                          />
                          <span className="text-sm">{name}</span>
                        </Label>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <PopoverActions
                  onClear={clearFirmFilter}
                  onApply={applyFirmNames}
                  disabled={isPending}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {(selected.length > 0 ||
          selectedFirms.length > 0 ||
          (isPending && !!pendingStatus)) && (
          <Button
            onClick={clearStatuses}
            variant={"secondary"}
            size={"sm"}
            className={clsx(
              "",
              isPending && pendingStatus
                ? "cursor-wait opacity-60"
                : "cursor-pointer",
            )}
          >
            {isPending && pendingStatus ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CircleXIcon className="size-4 text-red-700" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
