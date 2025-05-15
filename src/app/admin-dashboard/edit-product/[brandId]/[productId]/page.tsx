import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { getProductById } from "@/data/products";
import { getBrandById } from "@/data/brands";
import EditProductForm from "../../[brandNumber]/[productId]/edit-product-form";
import DeleteProductButton from "../../[brandNumber]/[productId]/delete-product-button";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ brandId: string; productId: string }>;
}) {
  const paramsValue = await params;
  const { brandId, productId } = paramsValue;
  const [brand, product] = await Promise.all([
    getBrandById(brandId),
    getProductById(productId),
  ]);

  return (
    <div>
      <EllipsisBreadCrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { href: "/admin-dashboard/brands", label: "Brands" },
          { label: "Edit Product" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex flex-col text-3xl font-bold">
              Edit Product
              <span className="text-muted-foreground text-xs font-normal">
                * marked fields are mandotory
              </span>
            </div>
            <DeleteProductButton
              brandId={brandId}
              productId={productId}
              totalBrandProducts={brand?.totalProducts}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditProductForm product={product} brandData={brand} />
        </CardContent>
      </Card>
    </div>
  );
}
