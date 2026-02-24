// app/products-list/responsive-product-filters.server.tsx
import { getBrands } from "@/data/brands";
import { FilterOptions } from "@/types/filterOptions";
import { BrandStatus } from "@/types/brandStatus";
import ProductFiltersShell from "@/components/custom/product-filters-shell";

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

  const brands = await getBrands({
    filters: { status: ["live"] as BrandStatus[] },
  });

  filterOptions.brands = brands?.data
    ?.map((b) => ({
      id: b.id,
      name: b.brandName,
      logo: b.brandLogo,
      categories: b.partCategories,
    }))
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));

  filterOptions.vehicleCompanies = Array.from(
    new Set(brands?.data?.flatMap((b) => [...(b.vehicleCompanies || [])])),
  ).sort();

  filterOptions.categories = Array.from(
    new Set(brands?.data?.flatMap((b) => b.partCategories || [])),
  ).sort();

  return (
    <ProductFiltersShell
      isAdmin={isAdmin}
      isUser={isUser}
      filterOptions={filterOptions}
      brandId={brandId}
    />
  );
}
