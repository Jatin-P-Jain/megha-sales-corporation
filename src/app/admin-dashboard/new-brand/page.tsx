import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewBrandForm from "./new-brand-form";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";

const NewProduct = () => {
  return (
    <div>
      <EllipsisBreadCrumbs
        items={[
          { href: "/admin-dashboard", label: "Admin Dashboard" },
          { href: "/admin-dashboard/brands", label: "Brands" },
          { label: "New Brand" },
        ]}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex flex-col">
            New Brand
            <span className="text-xs text-muted-foreground font-normal">
              * marked fields are mandotory
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <NewBrandForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProduct;
