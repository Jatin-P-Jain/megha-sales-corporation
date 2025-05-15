import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewProductForm from "./new-product-form";
import { cookies } from "next/headers";
import { getBrandById, getBrandsForDropDown } from "@/data/brands";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { Brand } from "@/types/brand";

interface SearchParamProps {
  searchParams: Promise<{ brandId: string }>;
}

const NewProduct = async ({ searchParams }: SearchParamProps) => {
  const searchParamsValue = await searchParams;
  const brandId = searchParamsValue?.brandId;
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    return;
  }
  let brandData: Brand | Brand[];
  if (brandId) {
    brandData = await getBrandById(brandId);
  } else {
    const data = await getBrandsForDropDown({ filters: { status: ["live"] } });
    brandData = data.data;
  }
  console.log({ brandData });

  const breadCrumbItems = !Array.isArray(brandData)
    ? [
        { href: "/admin-dashboard", label: "Admin Dashboard" },
        { href: "/admin-dashboard/brands", label: "Brands" },
        {
          href: "/admin-dashboard/brands",
          label: `${brandData?.brandName ?? ""}`,
        },
        { label: "New Product" },
      ]
    : [
        { href: "/products-list", label: "Product Listings" },
        { label: "New Product" },
      ];

  return (
    <div className="">
      <EllipsisBreadCrumbs items={breadCrumbItems} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex flex-col text-3xl font-bold">
            New Product
            <span className="text-muted-foreground text-xs font-normal">
              * marked fields are mandotory
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <NewProductForm brand={brandData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProduct;
