import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditBrandForm from "./edit-brand-form";
import { getBrandById } from "@/data/brands";

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
      <Breadcrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { label: "Edit Brand" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Brand</CardTitle>
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
