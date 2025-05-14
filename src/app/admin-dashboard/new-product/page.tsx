import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewProductForm from "./new-product-form";
import { cookies } from "next/headers";
import { getBrandById } from "@/data/brands";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";

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
  const brand = await getBrandById(brandId);

  return (
    <div className="">
      <EllipsisBreadCrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { href: "/admin-dashboard/brands", label: "Brands" },
          {
            href: "/admin-dashboard/brands",
            label: `${brand?.brandName ?? ""}`,
          },
          { label: "New Product" },
        ]}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex flex-col">
            New Product
            <span className="text-xs text-muted-foreground font-normal">
              * marked fields are mandotory
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <NewProductForm brand={brand} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProduct;
