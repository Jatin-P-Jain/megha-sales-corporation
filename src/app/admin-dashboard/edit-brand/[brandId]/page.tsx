import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditBrandForm from "./edit-brand-form";
import { getBrandById } from "@/data/brands";
import DeleteBrandButton from "./delete-brand-button";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";

export default async function EditProperty({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const paramsValue = await params;
  const { brandId } = paramsValue;
  const brand = await getBrandById(brandId);

  return (
    <div>
      <EllipsisBreadCrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { href: "/admin-dashboard/brands", label: "Brands" },
          { label: "Edit Brand" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="text-3xl font-bold flex flex-col">
              Edit Brand
              <span className="text-xs text-muted-foreground font-normal">
                * marked fields are mandotory
              </span>
            </div>
            <DeleteBrandButton brandId={brandId} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditBrandForm
            id={brand.id}
            brandName={brand.brandName}
            brandLogo={brand.brandLogo}
            companies={brand.companies}
            vehicleCompanies={brand.vehicleCompanies}
            vehicleNames={brand.vehicleNames}
            partCategories={brand.partCategories}
            totalProducts={brand.totalProducts}
            description={brand.description}
            status={brand.status}
            brandMedia={brand.brandMedia}
          />
        </CardContent>
      </Card>
    </div>
  );
}
