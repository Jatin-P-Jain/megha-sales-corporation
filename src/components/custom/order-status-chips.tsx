"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CircleXIcon, FilterIcon, Loader2Icon } from "lucide-react";
import { useTransition, useState, useEffect, useMemo } from "react";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { firestore } from "@/firebase/client";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

export const STATUSES: { label: string; value: string }[] = [
  { label: "Pending", value: "pending" },
  { label: "Packing", value: "packing" },
  { label: "Dispatch", value: "dispatch" },
];

export default function OrderStatusChips({ isAdmin }: { isAdmin: boolean }) {
  const router = useSafeRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // track exactly which chip is being toggled (or "clear" for the clear button)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // reset pendingCategory once React finishes the transition
  useEffect(() => {
    if (!isPending) {
      setPendingStatus(null);
    }
  }, [isPending]);

  const [firmDialogOpen, setFirmDialogOpen] = useState(false);
  const [firmNames, setFirmNames] = useState<string[]>([]);
  const [firmsLoading, setFirmsLoading] = useState(false);

  // read current selected categories
  const selected = params.getAll("orderStatus");
  const selectedFirm = params.get("firmName") ?? "";

  const selectedLabel = useMemo(() => {
    if (selected.length === 0) return "All Status";
    if (selected.length === 1) {
      return STATUSES.find((s) => s.value === selected[0])?.label ?? "1 Status";
    }
    return `${selected.length} Statuses`;
  }, [selected]);

  useEffect(() => {
    if (!isAdmin || !firmDialogOpen || firmNames.length > 0) return;

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
  }, [firmDialogOpen, firmNames.length, isAdmin]);

  const updateQuery = (mutate: (qp: URLSearchParams) => void) => {
    const qp = new URLSearchParams(Array.from(params.entries()));
    mutate(qp);
    qp.set("page", "1");
    startTransition(() => {
      router.push(`/order-history?${qp.toString()}`);
    });
  };

  // toggle one category on/off
  function toggleStatus(status: string) {
    // mark this one as pending
    setPendingStatus(status);
    updateQuery((qp) => {
      qp.delete("orderStatus");
      const next = selected.includes(status)
        ? selected.filter((c) => c !== status)
        : [...selected, status];
      next.forEach((s) => qp.append("orderStatus", s));
    });
  }

  // clear all categories
  function clearStatuses() {
    setPendingStatus("clear");

    updateQuery((qp) => {
      qp.delete("orderStatus");
      qp.delete("firmName");
    });
  }

  function selectFirmName(firmName: string) {
    setPendingStatus("firm");
    updateQuery((qp) => {
      if (!firmName || selectedFirm === firmName) {
        qp.delete("firmName");
        return;
      }
      qp.set("firmName", firmName);
    });
    setFirmDialogOpen(false);
  }

  return (
    <div className={clsx("flex w-full gap-2")}>
      <div className="flex w-full items-center gap-2 md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-fit flex-1 px-3 py-1 text-xs"
            >
              {selectedLabel}
              {isPending && pendingStatus !== "firm" ? (
                <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <div className="mb-2 text-xs font-medium">Order Status</div>
            <div className="flex flex-col gap-2">
              {STATUSES.map(({ label, value }) => {
                const checked = selected.includes(value);
                return (
                  <Label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleStatus(value)}
                    />
                    <span className="text-xs">{label}</span>
                  </Label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {isAdmin && (
          <Button
            variant="outline"
            className="h-fit px-3 py-1 text-xs"
            onClick={() => setFirmDialogOpen(true)}
          >
            <FilterIcon className="mr-1 h-3.5 w-3.5" />
            Filters
          </Button>
        )}
      </div>

      <Card className="no-scrollbar hidden w-full flex-row items-center justify-end gap-1 overflow-x-auto border-0 p-0 shadow-none md:flex">
        {STATUSES.map(({ label, value }) => {
          const isSel = selected.includes(value);
          const isThisPending = isPending && pendingStatus === value;
          return (
            <Button
              key={label}
              variant={isSel ? "default" : "outline"}
              onClick={() => toggleStatus(value)}
              disabled={isThisPending}
              className={clsx(
                "h-fit min-w-max shrink-0 rounded-full p-1 px-3 text-xs md:px-6 md:text-sm",
                isSel &&
                  `${
                    value === "pending"
                      ? "border-amber-600 bg-amber-100 text-yellow-600 hover:bg-amber-200/60"
                      : value === "dispatch"
                        ? "border-green-700 bg-green-100 text-green-700 hover:bg-green-200/60"
                        : value === "packing"
                          ? "border-sky-700 bg-sky-100 text-sky-700 hover:bg-sky-200/60"
                          : ""
                  }`,
                "border",
                isThisPending && "cursor-wait opacity-60",
              )}
            >
              {label}
              {isThisPending && (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              )}
            </Button>
          );
        })}
      </Card>

      {isAdmin && (
        <Button
          variant="outline"
          className="hidden h-fit px-3 py-1 text-xs md:flex"
          onClick={() => setFirmDialogOpen(true)}
        >
          <FilterIcon className="mr-1 h-3.5 w-3.5" />
          Filters
        </Button>
      )}

      {selected.length > 0 && (
        <div
          onClick={clearStatuses}
          className={clsx(
            "flex w-fit items-center justify-center rounded-full p-0",
            pendingStatus === "clear" && isPending
              ? "cursor-wait opacity-60"
              : "cursor-pointer",
          )}
        >
          {pendingStatus === "clear" && isPending ? (
            <Loader2Icon className="h-5 w-5 animate-spin" />
          ) : (
            <CircleXIcon className="text-muted-foreground h-5 w-5" />
          )}
        </div>
      )}

      <Dialog open={firmDialogOpen} onOpenChange={setFirmDialogOpen}>
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="text-base">Filter by Firm Name</DialogTitle>
          </DialogHeader>

          <div className="text-muted-foreground text-xs">
            Select a firm to filter orders placed by that firm.
          </div>

          <ScrollArea className="mt-1 max-h-64 rounded-md border p-2">
            <div className="flex flex-col gap-2">
              <Label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={!selectedFirm}
                  onCheckedChange={() => selectFirmName("")}
                />
                <span className="text-xs">All firms</span>
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
                      checked={selectedFirm === name}
                      onCheckedChange={() => selectFirmName(name)}
                    />
                    <span className="text-xs">{name}</span>
                  </Label>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFirmDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
