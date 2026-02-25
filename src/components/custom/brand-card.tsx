import { Brand } from "@/types/brand";
import { Card, CardHeader } from "../ui/card";
import BrandLogo from "./brand-logo";
import { SafeLink } from "./utility/SafeLink";

export default function BrandCard({ brand }: { brand: Brand }) {
  const href = `/products-list?brandId=${encodeURIComponent(brand.id)}&page=1`;

  return (
    <SafeLink
      href={href}
      className="block focus:outline-none"
      // If you render tons of these cards, consider prefetch={false} to reduce network work. [web:285]
      // prefetch={false}
    >
      <Card className="w-full cursor-pointer gap-4 p-2 shadow-md">
        <CardHeader className="flex w-full items-center justify-between p-0">
          <div className="relative flex h-25 w-full flex-col items-center justify-center">
            <BrandLogo brandLogo={brand?.brandLogo} />
            <div className="text-sm font-medium md:text-base">
              {brand.brandName}
            </div>
          </div>
        </CardHeader>
      </Card>
    </SafeLink>
  );
}
