"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Loader2Icon } from "lucide-react";

export default function StatusFilter({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  // Clear the “pending” once the transition finishes
  useEffect(() => {
    if (!isPending) setPendingValue(null);
  }, [isPending]);

  // current status from URL
  const currentStatus = params.get("status") ?? "";

  function onStatusChange(newStatus: string) {
    setPendingValue(newStatus);

    // build new query string
    const qp = new URLSearchParams(Array.from(params.entries()));
    qp.set("status", newStatus);
    qp.set("page", "1"); // reset page

    startTransition(() => {
      router.push(`/products-list?${qp.toString()}`, { scroll: false });
    });
  }

  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="relative w-full min-w-40">
        <SelectValue placeholder="Filter on Status" />

        {/* reserve space for the spinner and only show when pending */}
        <div className="absolute top-1/2 right-8 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
          {isPending && pendingValue !== null && (
            <Loader2Icon className="text-muted-foreground h-4 w-4 animate-spin" />
          )}
        </div>
      </SelectTrigger>

      <SelectContent>
        {isAdmin && <SelectItem value="all">All</SelectItem>}
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="for-sale">For Sale</SelectItem>
        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
        <SelectItem value="discontinued">Discontinued</SelectItem>
      </SelectContent>
    </Select>
  );
}
