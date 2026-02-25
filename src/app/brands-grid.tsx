// app/brands-grid.tsx
import BrandCard from "@/components/custom/brand-card";
import type { Brand } from "@/types/brand";
import { Button } from "@/components/ui/button";
import { SafeLink } from "@/components/custom/utility/SafeLink";

type Props = {
  brandsPromise: Promise<{ data: Brand[]; totalPages?: number }>;
};

export default async function BrandsGrid({ brandsPromise }: Props) {
  const { data: brands } = await brandsPromise;

  const lcvBrands = brands.filter((b) => b.vehicleCategory === "lcv");
  const hcvBrands = brands.filter((b) => b.vehicleCategory === "hcv");
  const bothBrands = brands.filter((b) => b.vehicleCategory === "both");

  if (!brands || brands.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        No Brands Available.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="text-muted-foreground flex w-full items-center justify-between text-xs md:text-base">
        <div>Browse products by brands</div>
        <Button variant="link" asChild className="p-0">
          <SafeLink href="/products-list">Show all products</SafeLink>
        </Button>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-4">
        {lcvBrands.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <div className="font-medium">
              LCV Brands{" "}
              <span className="text-muted-foreground ml-2 text-xs">
                (Light Commercial Vehicles)
              </span>
            </div>
            <div className="grid w-full grid-cols-3 items-center gap-3 md:grid-cols-4">
              {lcvBrands.map((brand) => (
                <BrandCard brand={brand} key={brand.id} />
              ))}
            </div>
          </div>
        )}

        {hcvBrands.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <div className="font-medium">
              HCV Brands{" "}
              <span className="text-muted-foreground ml-2 text-xs">
                (Heavy Commercial Vehicles)
              </span>
            </div>
            <div className="grid w-full grid-cols-3 items-center gap-3 md:grid-cols-4">
              {hcvBrands.map((brand) => (
                <BrandCard brand={brand} key={brand.id} />
              ))}
            </div>
          </div>
        )}

        {bothBrands.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <div className="font-medium">
              LCV &amp; HCV Brands{" "}
              <span className="text-muted-foreground ml-2 text-xs">
                (Light &amp; Heavy Commercial Vehicles)
              </span>
            </div>
            <div className="grid w-full grid-cols-3 items-center gap-3 md:grid-cols-4">
              {bothBrands.map((brand) => (
                <BrandCard brand={brand} key={brand.id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
