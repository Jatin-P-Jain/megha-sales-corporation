"use client";
import React, { useEffect, useState } from "react";
import BrandCard from "@/components/custom/brand-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand } from "@/types/brand";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  brandsPromise: Promise<{ data: Brand[]; totalPages?: number }>;
};

export default function BrandsGrid({ brandsPromise }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchBrands() {
      try {
        const { data } = await brandsPromise;
        if (!isMounted) return;
        setBrands(data);
      } catch (error) {
        console.error("Failed to load brands:", error);
        if (!isMounted) return;
        setBrands([]); // treat errors as “no brands”
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    fetchBrands();
    return () => {
      isMounted = false;
    };
  }, [brandsPromise]);

  // Split into categories
  const lcvBrands = brands.filter((b) => b.vehicleCategory === "lcv");
  const hcvBrands = brands.filter((b) => b.vehicleCategory === "hcv");
  const bothBrands = brands.filter((b) => b.vehicleCategory === "both");

  // 1) While loading, show a skeleton placeholder
  if (loading) {
    return (
      <div className="mt-4 flex w-full flex-col gap-4">
        <Skeleton className="h-6 w-1/4 rounded-sm" />{" "}
        {/* “Browse by brands” placeholder */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Render 4 placeholder cards */}
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2) Once loading is false, if there are no brands at all:
  if (brands.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        No Brands Available.
      </div>
    );
  }

  // 3) Otherwise, render the real grid
  return (
    <div className="mt-4 flex w-full flex-col gap-2">
      <div className="text-muted-foreground flex w-full items-center justify-between text-sm md:text-base">
        <div>Browse products by brands</div>
        <Button variant={"link"} asChild className="p-0">
          <Link href={"/products-list"}>Show all products</Link>
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
              LCV & HCV Brands{" "}
              <span className="text-muted-foreground ml-2 text-xs">
                (Light & Heavy Commercial Vehicles)
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
