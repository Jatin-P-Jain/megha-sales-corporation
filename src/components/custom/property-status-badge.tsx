import { PropertyStatus } from "@/types/propertyStatus";
import { Badge } from "../ui/badge";

const propertyStatusLabel = {
  "for-sale": "For Sale",
  withdrawn: "Withdrawn",
  sold: "Sold",
  draft: "Draft",
};

const badgeVariant: {
  [key: string]: "primary" | "destructive" | "success" | "secondary";
} = {
  "for-sale": "primary",
  withdrawn: "destructive",
  sold: "success",
  draft: "secondary",
};

export default function PropertyStatusBadge({
  status,
  className,
}: {
  status: PropertyStatus;
  className?: string;
}) {
  return (
    <Badge variant={badgeVariant[status]} className={className}>
      {propertyStatusLabel[status]}
    </Badge>
  );
}
