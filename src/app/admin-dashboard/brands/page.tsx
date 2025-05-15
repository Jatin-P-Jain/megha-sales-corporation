import BrandLogo from "@/components/custom/brand-logo";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import PublishBrandButton from "@/components/custom/publish-brand-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBrands } from "@/data/brands";
import { PencilIcon, PlusCircleIcon, WrenchIcon } from "lucide-react";
import Link from "next/link";

const AdminBrands = async ({
  searchParams,
}: {
  searchParams?: Promise<{ page: string }>;
}) => {
  const searchParamsValue = await searchParams;
  const page = searchParamsValue?.page ? parseInt(searchParamsValue.page) : 1;
  const { data } = await getBrands({
    pagination: { page, pageSize: 10 },
  });
  return (
    <div>
      <EllipsisBreadCrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { label: "Brands" },
        ]}
      />
      <h1 className="mt-6 text-4xl font-bold">Brands</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="flex min-h-50 cursor-pointer items-center justify-center gap-4 border-2 border-dashed bg-gray-100/50 p-4 shadow-md">
          <Link
            href={"/admin-dashboard/new-brand"}
            className="text-primary flex h-full w-full items-center justify-center gap-2 text-lg font-semibold"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add Brand
          </Link>
        </Card>
        {data.map((brand) => (
          <Card key={brand.id} className="gap-4 p-4 shadow-md">
            <CardHeader className="flex w-full items-center justify-between p-0 text-xl font-bold">
              <CardTitle className="px- text-primary text-xl font-semibold">
                {brand.brandName}
              </CardTitle>
              <div className="flex items-center justify-center gap-1">
                <div
                  className={`${
                    brand.status === "draft"
                      ? "text-yellow-600"
                      : brand.status === "live"
                        ? "text-green-700"
                        : brand.status === "discontinued"
                          ? "text-red-600"
                          : ""
                  } px-1 py-1 text-sm font-semibold`}
                >
                  {brand.status === "draft"
                    ? "DRAFT"
                    : brand.status === "live"
                      ? "LIVE"
                      : brand.status === "discontinued"
                        ? "REMOVED"
                        : ""}
                </div>
                <Link
                  href={`/admin-dashboard/edit-brand/${brand.id}`}
                  className="border-primary/70 text-primary flex items-center justify-center gap-1 rounded-lg border-1 p-1.5 py-1"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span className="text-xs md:text-sm">Edit</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-1 p-0">
              <div className="relative flex h-30 w-full flex-col items-center justify-center">
                <BrandLogo brandLogo={brand?.brandLogo} />
              </div>
              <CardDescription className="flex w-full flex-1 flex-col justify-center gap-2 p-0">
                <div className="text-muted-foreground mb-2 line-clamp-2 text-justify text-xs text-ellipsis">
                  {brand.description}
                </div>

                {brand?.vehicleNames && brand?.vehicleNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {brand?.vehicleNames.slice(0, 2).map((company, i) => (
                      <span key={i} className="text-muted-foreground text-sm">
                        {`• ${company} `}
                      </span>
                    ))}
                    {brand?.vehicleNames.length > 2 && (
                      <span className="text-primary/80 text-sm font-semibold">
                        {`+ ${brand.vehicleNames.length - 2} more`}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-primary/80 flex flex-wrap gap-1 text-xs">
                  {brand.partCategories.slice(0, 2).map((partCategory, i) => (
                    <span key={i} className="font-semibold">
                      <WrenchIcon className="inline-block h-4 w-4" />
                      {` ${partCategory} `}
                    </span>
                  ))}
                  {brand.partCategories.length > 2 && (
                    <span className="font-semibold">
                      {`+ ${brand.partCategories.length - 2} more`}
                    </span>
                  )}
                </div>
              </CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-between gap-1 px-0">
              <div
                className={`flex w-full items-center text-sm ${
                  brand.status === "live" ? "justify-between" : "justify-center"
                }`}
              >
                <div className="flex items-center justify-center">
                  Total Products:
                  <span
                    className={`ml-2 text-base font-semibold ${
                      brand.status === "draft"
                        ? "text-yellow-600"
                        : brand.status === "live"
                          ? "text-green-700"
                          : brand.status === "discontinued"
                            ? "text-red-600"
                            : ""
                    }`}
                  >
                    {brand.totalProducts}
                  </span>
                </div>
                {brand.totalProducts > 0 && (
                  <Link
                    href={"/admin-dashboard/products-list"}
                    className="text-primary font-semibold hover:underline"
                  >
                    Show Products
                  </Link>
                )}
              </div>

              {brand?.status === "draft" && (
                <PublishBrandButton brandId={brand.id} newStatus="live" />
              )}

              {brand?.status === "live" && (
                <Button className="w-full gap-2" asChild>
                  <Link
                    href={{
                      pathname: "/admin-dashboard/new-product",
                      query: { brandId: brand.id },
                    }}
                  >
                    <PlusCircleIcon />
                    Add Product
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminBrands;
