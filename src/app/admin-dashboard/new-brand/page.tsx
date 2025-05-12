import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewBrandForm from "./new-brand-form";


const NewProduct = () => {
  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { label: "New Brand" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">New Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <NewBrandForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProduct;
