import { getBrandById, VEHICLE_CATEGORIES } from "@/data/brands";
import { Brand } from "@/types/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLinkIcon,
  GlobeIcon,
  ListOrderedIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { BrandMediaViewer } from "@/components/custom/brand-media-viewer";
import clsx from "clsx";

interface BrandPageProps {
  params: Promise<{
    brandId: string;
  }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;
  const paramsValue = await params;
  const brand: Brand = await getBrandById(paramsValue.brandId);

  return (
    <div className="mx-auto max-w-4xl space-y-2 px-4 py-4 md:py-6">
      <div
        className={clsx(
          "flex w-full justify-between gap-0",
          isAdmin && "items-start md:items-center",
        )}
      >
        <div className="text-muted-foreground flex items-center justify-center text-lg font-semibold">
          About Brand
        </div>
        <div className="text-primary flex flex-col-reverse items-end justify-between text-sm font-semibold md:flex-row">
          <Button
            variant={"ghost"}
            className="hover:text-primary flex items-center justify-between gap-1 !p-1 md:!px-4"
            asChild
          >
            <Link href={`/products-list?brandId=${brand.id}`}>
              <ListOrderedIcon className="size-4" />
              {brand?.brandName} Products
            </Link>
          </Button>
          {isAdmin && (
            <Button
              variant={"ghost"}
              className="hover:text-primary flex items-center justify-between gap-1 !p-1 md:!px-4"
              asChild
              size={"sm"}
            >
              <Link href={`/admin-dashboard/edit-brand/${brand.id}`}>
                <PencilIcon className="size-4" />
                Edit Brand
              </Link>
            </Button>
          )}
        </div>
      </div>
      <Card className="gap-1 pt-4">
        <CardHeader className="p-0">
          <div className="flex flex-col items-center justify-center gap-2">
            <Image
              src={imageUrlFormatter(brand.brandLogo)}
              alt={brand.brandName}
              width={200}
              height={200}
              className=""
            />
            <div className="flex w-full flex-col items-center justify-center gap-3">
              <CardTitle className="text-primary text-2xl font-bold">
                {brand.brandName}
              </CardTitle>
              <Badge variant="secondary">
                Total Products:{" "}
                <span className="text-primary text-base font-semibold">
                  {brand.totalProducts}
                </span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="">
          <div className="mb-2 flex w-full flex-col items-center justify-between gap-2 md:mb-4 md:flex-row">
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <GlobeIcon className="size-4" /> Brand Website
            </div>
            {brand?.brandWebsite ? (
              <Button
                variant={"link"}
                className="text-muted-foreground decoration-primary mb-4 flex h-0 min-h-0 items-center justify-center gap-2 !px-0 text-sm"
                asChild
              >
                <Link href={brand?.brandWebsite} target="_blank">
                  <span className="text-sky-800">{brand.brandWebsite}</span>
                  <ExternalLinkIcon className="size-4 text-sky-800" />
                </Link>
              </Button>
            ) : (
              <span className="text-muted-foreground text-xs">
                No Website available
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            {brand.description || "No description available."}
          </p>
          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-muted-foreground font-medium">
                  Companies
                </span>
                <div>{brand.companies.join(", ")}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">
                  Vehicle Category
                </span>
                <div className="font-semibold">
                  {
                    VEHICLE_CATEGORIES[
                      brand.vehicleCategory as keyof typeof VEHICLE_CATEGORIES
                    ]
                  }
                </div>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">
                Vehicle Companies
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {brand.vehicleCompanies.map((company) => (
                  <Badge
                    key={company}
                    variant="outline"
                    className="rounded-full px-2 py-1 text-xs"
                  >
                    {company}
                  </Badge>
                ))}
              </div>
            </div>
            {brand.vehicleNames?.length ? (
              <div className="">
                <span className="text-muted-foreground font-medium">
                  Vehicle Names
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {brand.vehicleNames?.map((vehicleName) => (
                    <Badge
                      key={vehicleName}
                      variant="outline"
                      className="rounded-full px-2 py-1"
                    >
                      {vehicleName}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <span className="text-muted-foreground font-medium">
                Part Categories
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {brand.partCategories.map((category) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="rounded-full px-2 py-1"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <BrandMediaViewer brandMedia={brand?.brandMedia} />
    </div>
  );
}
