import ResponsiveProductFilters from "@/components/custom/responsive-product-filters";
import React, { Suspense } from "react";
import ProductFilterSkeleton from "./product-filter-skeleton";
import { getBrands } from "@/data/brands";
import { FilterOptions } from "@/types/filterOptions";
import { BrandStatus } from "@/types/brandStatus";

export default async function ResponsiveProductFiltersServer({
  isAdmin,
  isUser,
  brandId,
}: {
  isAdmin: boolean;
  isUser: boolean;
  brandId?: string;
}) {
  const filterOptions: FilterOptions = {
    brands: [],
    vehicleCompanies: [],
    categories: [],
    prices: { min: 0, max: 100000 },
    discount: { min: 0, max: 100 },
  };
  const brandFilters: {
    status?: BrandStatus[] | null;
    getAll?: boolean;
    brandId?: string;
  } = { status: ["live"] };
  const brands = await getBrands({
    filters: brandFilters,
  });

  // 1. Brands
  filterOptions.brands = brands?.data
    ?.map((b) => ({
      id: b.id,
      name: b.brandName,
      logo: b.brandLogo,
      categories: b.partCategories,
    }))
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));

  // 2. Vehicle Companies (flatten all companies from all brands, unique)
  filterOptions.vehicleCompanies = Array.from(
    new Set(brands?.data?.flatMap((b) => [...(b.vehicleCompanies || [])])),
  ).sort();

  // 3. Categories (flatten all partCategories from all brands, unique)
  filterOptions.categories = Array.from(
    new Set(brands?.data?.flatMap((b) => b.partCategories || [])),
  ).sort();

  return (
    <Suspense fallback={<ProductFilterSkeleton />}>
      <ResponsiveProductFilters
        isAdmin={isAdmin}
        isUser={isUser}
        filterOptions={filterOptions}
        brandId={brandId}
      />
    </Suspense>
  );
}
