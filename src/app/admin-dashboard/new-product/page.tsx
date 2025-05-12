import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewProductForm from "./new-product-form";
import { cookies } from "next/headers";
import { getBrandById } from "@/data/brands";

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
    <div>
      <Breadcrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { label: "New Product" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">New Product</CardTitle>
        </CardHeader>
        <CardContent className="">
          <NewProductForm brand={brand} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProduct;
