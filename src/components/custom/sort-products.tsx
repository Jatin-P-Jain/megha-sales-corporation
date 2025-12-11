import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useIsMobile from "@/hooks/useIsMobile";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDownIcon } from "lucide-react";
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
  const isMobile = useIsMobile();
  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);
  return (
    <div className="flex w-full items-center justify-center gap-2 text-xs">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={clsx(
            "text-xs font-semibold",
            selectedOption && "border-primary border-2",
          )}
        >
          {!selectedOption ? (
            <span className="text-muted-foreground flex items-center gap-1">
              <ArrowUpDownIcon className="size-4" /> Sort By
            </span>
          ) : (
            <div className="flex w-full gap-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <ArrowUpDownIcon className="text-primary size-4" />{" "}
                {!isMobile && ":"}
              </span>

              {!isMobile && (
                <span className="flex items-center gap-1 font-semibold">
                  {selectedOption.label.split(": ")[0]}:
                  <span className="flex items-center gap-1 font-semibold">
                    {selectedOption.label.split(": ")[1]}
                    {selectedOption.dir === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </span>
                </span>
              )}
            </div>
          )}
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
