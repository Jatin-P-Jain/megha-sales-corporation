import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditPropertyForm from "./edit-property-form";
import { getPropertyById } from "@/data/properties";

export default async function EditProperty({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const paramsValue = await params;
  const { propertyId } = paramsValue;
  const property = await getPropertyById(propertyId);

  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/admin-dashboard", label: "Dashboard" },
          { label: "Edit Property" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Property</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPropertyForm
            id={property.id}
            address1={property.address1}
            address2={property.address2}
            bathrooms={property.bathrooms}
            bedrooms={property.bedrooms}
            city={property.city}
            description={property.description}
            postalCode={property.postalCode}
            price={property.price}
            status={property.status}
            images={property.images}
          />
        </CardContent>
      </Card>
    </div>
  );
}
