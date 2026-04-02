"use client";

import React, { Suspense } from "react";
import ResponsiveProductFilters from "@/components/custom/responsive-product-filters";
import type { FilterOptions } from "@/types/filterOptions";
import ProductFilterSkeleton from "@/app/products-list/product-filter-skeleton";

export default function ProductFiltersShell(props: {
  isAdmin: boolean;
  isUser: boolean;
  brandId?: string;
  filterOptions: FilterOptions;
}) {
  return (
    <Suspense fallback={<ProductFilterSkeleton />}>
      <ResponsiveProductFilters {...props} />
    </Suspense>
  );
}
