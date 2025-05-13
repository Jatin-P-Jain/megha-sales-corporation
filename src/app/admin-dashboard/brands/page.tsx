import BrandLogo from "@/components/custom/brand-logo";
import PublishBrandButton from "@/components/custom/publish-brand-button";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
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
      <Breadcrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { label: "Brands" },
        ]}
      />
      <h1 className="text-4xl font-bold mt-6">Brands</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        <Card className="p-4 gap-4 shadow-md border-dashed bg-gray-100/50 border-2 flex items-center justify-center cursor-pointer min-h-50">
          <Link
            href={"/admin-dashboard/new-brand"}
            className="w-full h-full flex justify-center items-center text-lg font-semibold gap-2 text-primary"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Add Brand
          </Link>
        </Card>
        {data.map((brand) => (
          <Card key={brand.id} className="p-4 gap-4 shadow-md">
            <CardHeader className="flex text-xl font-bold justify-between items-center w-full  p-0">
              <CardTitle className="px- text-primary font-semibold text-xl">
                {brand.brandName}
              </CardTitle>
              <div className="flex gap-1 items-center justify-center">
                <div
                  className={`${
                    brand.status === "draft"
                      ? "text-yellow-600"
                      : brand.status === "live"
                      ? "text-green-700 "
                      : brand.status === "discontinued"
                      ? "text-red-600"
                      : ""
                  }  text-sm font-semibold px-1 py-1 `}
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
                  className="p-1.5 rounded-lg border-1 border-primary/70 text-primary flex items-center justify-center gap-1 py-1"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  <span className="text-xs md:text-sm">Edit</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-1 flex-1">
              <div className="flex flex-col relative w-full h-30 items-center justify-center">
                <BrandLogo brandLogo={brand?.brandLogo} />
              </div>
              <CardDescription className="p-0 flex flex-col gap-2 justify-center w-full flex-1">
                <div className="text-ellipsis line-clamp-2 text-justify text-muted-foreground text-xs mb-2">
                  {brand.description}
                </div>

                {brand?.vehicleNames && brand?.vehicleNames.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {brand?.vehicleNames.slice(0, 2).map((company, i) => (
                      <span key={i} className="text-sm text-muted-foreground">
                        {`• ${company} `}
                      </span>
                    ))}
                    {brand?.vehicleNames.length > 2 && (
                      <span className="text-sm font-semibold text-primary/80">
                        {`+ ${brand.vehicleNames.length - 2} more`}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-1 flex-wrap text-xs text-primary/80">
                  {brand.partCategories.slice(0, 2).map((partCategory, i) => (
                    <span key={i} className="font-semibold ">
                      <WrenchIcon className="w-4 h-4 inline-block" />
                      {` ${partCategory} `}
                    </span>
                  ))}
                  {brand.partCategories.length > 2 && (
                    <span className="font-semibold ">
                      {`+ ${brand.partCategories.length - 2} more`}
                    </span>
                  )}
                </div>
              </CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col gap-1 px-0 justify-between items-center">
              <div
                className={`flex text-sm w-full items-center ${
                  brand.status === "live" ? "justify-between" : "justify-center"
                }`}
              >
                <div className="flex items-center justify-center">
                  Total Products:
                  <span
                    className={`font-semibold text-base ml-2 ${
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
                {brand.status === "live" && (
                  <Link
                    href={""}
                    className="font-semibold text-primary hover:underline"
                  >
                    Show Products
                  </Link>
                )}
              </div>

              {brand?.status === "draft" && (
                <PublishBrandButton brandId={brand.id} newStatus="live" />
              )}

              {brand?.status === "live" && (
                <Button className="gap-2 w-full" asChild>
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
