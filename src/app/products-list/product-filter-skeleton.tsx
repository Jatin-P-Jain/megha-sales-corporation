import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ProductFilterSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/4" />
      </div>
      <Skeleton className="h-8 w-full" />
    </div>
  );
};

export default ProductFilterSkeleton;
