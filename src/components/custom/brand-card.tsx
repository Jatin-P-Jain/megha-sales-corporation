"use client";
import { Brand } from "@/types/brand";
import { Card, CardHeader } from "../ui/card";
import BrandLogo from "./brand-logo";
import { useRouter } from "next/navigation";

export default function BrandCard({ brand }: { brand: Brand }) {
  const router = useRouter();
  const brandCardClickHandler = (brandId: string) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("brandId", brandId);
    router.push(`/products-list?${newSearchParams}`);
  };

  return (
    <Card
      key={brand.id}
      className="w-full cursor-pointer gap-4 p-2 shadow-md"
      onClick={() => brandCardClickHandler(brand.id)}
    >
      <CardHeader className="flex w-full items-center justify-between p-0">
        <div className="relative flex h-25 w-full flex-col items-center justify-center">
          <BrandLogo brandLogo={brand?.brandLogo} />
          <div className="text-sm md:text-base">{brand.brandName}</div>
        </div>
      </CardHeader>
    </Card>
  );
}
