// app/products-list/ResponsiveProductFilters.server.tsx
import ResponsiveProductFilters from "@/components/custom/responsive-product-filters";
import React, { Suspense } from "react";
import ProductFilterSkeleton from "./product-filter-skeleton";

export default async function ResponsiveProductFiltersServer({
  isAdmin,
  isUser,
  categoriesPromise,
  brandId,
}: {
  isAdmin: boolean;
  isUser: boolean;
  categoriesPromise: Promise<string[]>;
  brandId?: string;
}) {
  const categories = await categoriesPromise;
  return (
    <Suspense fallback={<ProductFilterSkeleton />}>
      <ResponsiveProductFilters
        isAdmin={isAdmin}
        isUser={isUser}
        categories={categories}
        brandId={brandId}
      />
    </Suspense>
  );
}
