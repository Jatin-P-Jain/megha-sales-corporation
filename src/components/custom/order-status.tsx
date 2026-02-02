"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { OrderStatus } from "@/types/order";

const statusStyles: Record<
  OrderStatus,
  {
    border: string;
    text: string;
    bg: string;
    icon: string;
    focusVisible: string;
  }
> = {
  pending: {
    border: "border-amber-600",
    text: "text-yellow-600",
    bg: "bg-amber-100",
    icon: "text-yellow-600 opacity-100",
    focusVisible: "focus-visible:border-amber-600 border-2",
  },
  packing: {
    border: "border-sky-700",
    text: "text-sky-700",
    bg: "bg-sky-100",
    icon: "text-sky-700 opacity-100",
    focusVisible: "focus-visible:border-sky-700 border-2",
  },
  dispatch: {
    border: "border-green-700",
    text: "text-green-700",
    bg: "bg-green-100",
    icon: "text-green-700 opacity-100",
    focusVisible: "focus-visible:border-green-700",
  },
};

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Packing", value: "packing" },
  { label: "Dispatch", value: "dispatch" },
];

type OrderStatusDropdownProps = {
  status: OrderStatus;
  isAdmin?: boolean;
  onChange?: (status: OrderStatus) => void;
};

export function OrderStatusDropdown({
  status,
  isAdmin = false,
  onChange,
}: OrderStatusDropdownProps) {
  const style = statusStyles[status];

  return (
    <div className="text-muted-foreground flex w-full items-center justify-between text-xs md:text-sm">
      Status:
      {isAdmin ? (
        <Select
          value={status}
          onValueChange={(val) => onChange?.(val as OrderStatus)}
        >
          <SelectTrigger
            className={clsx(
              "!h-2 min-h-0 py-3 px-2 gap-1 font-semibold",
              "shadow-none ring-0 outline-none focus:shadow-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              style.border,
              style.text,
              style.bg,
            )}
            iconClassName={style.icon}
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span
          className={clsx(
            "flex items-center justify-between gap-1 rounded-full border-1 px-3 text-sm font-semibold md:text-base",
            style.border,
            style.text,
            style.bg,
          )}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )}
    </div>
  );
}
