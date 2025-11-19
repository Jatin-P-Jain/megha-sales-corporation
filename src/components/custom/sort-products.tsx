import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Arrow } from "@radix-ui/react-dropdown-menu";
import { ArrowDown, ArrowUp } from "lucide-react";

import { useSearchParams } from "next/navigation";

// Put your sort options here
const SORT_OPTIONS = [
  {
    label: "Brand Name: A - Z",
    value: "brandName-asc",
    field: "brandName",
    dir: "asc",
  },
  {
    label: "Brand Name: Z - A",
    value: "brandName-desc",
    field: "brandName",
    dir: "desc",
  },
  {
    label: "Part Name: A - Z",
    value: "partName-asc",
    field: "partName",
    dir: "asc",
  },
  {
    label: "Part Name: Z - A",
    value: "partName-desc",
    field: "partName",
    dir: "desc",
  },
  {
    label: "(₹) Price: Low - High",
    value: "price-asc",
    field: "price",
    dir: "asc",
  },
  {
    label: "(₹) Price: High - Low",
    value: "price-desc",
    field: "price",
    dir: "desc",
  },
];

export function SortBySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (newValue: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-center gap-2 text-xs">
      <span className="whitespace-nowrap">Sort by:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="text-xs font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORT_OPTIONS.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="flex w-full items-center justify-between"
            >
              <span className="text-muted-foreground text-xs">
                {opt.label.split(": ")[0]}:
              </span>
              <span className="flex items-center gap-1 font-semibold">
                {opt.label.split(": ")[1]}
                {opt.dir === "asc" ? (
                  <ArrowUp className="text-normal" />
                ) : (
                  <ArrowDown className="text-normal" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
