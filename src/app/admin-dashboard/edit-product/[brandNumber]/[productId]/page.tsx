import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteProductButton from "./delete-product-button";
import EditProductForm from "./edit-product-form";
import { getProductById } from "@/data/products";
import { getBrandById } from "@/data/brands";

const EditProductPage = async ({
  params,
}: {
  params: Promise<{ brandNumber: string; productId: string }>;
}) => {
  const paramsValue = await params;
  const { brandNumber, productId } = paramsValue;
  const [product, brand] = await Promise.all([
    getProductById(productId),
    getBrandById(brandNumber),
  ]);
  return (
    <div>
      <EllipsisBreadCrumbs
        items={[
          { href: "/products-list", label: "Product Listings" },
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
              productId={productId}
              brandId={brandNumber}
              totalBrandProducts={brand?.totalProducts}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditProductForm product={product} brand={brand} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProductPage;
