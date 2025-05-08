import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import Link from "next/link";
// import PropertiesTable from "../../components/custom/properties-table";
// import { getProperties } from "@/data/properties";

const AdminDashboard = async ({
  // searchParams,
}: {
  // searchParams?: Promise<{ page: string }>;
}) => {
  // const searchParamsValue = await searchParams;
  // const page = searchParamsValue?.page ? parseInt(searchParamsValue.page) : 1;
  // const { data, totalPages } = await getProperties({
  //   pagination: { page, pageSize: 5 },
  // });
  return (
    <div>
      <Breadcrumbs items={[{ label: "Admin Dashboard" }]}></Breadcrumbs>
      <h1 className="text-4xl font-bold mt-6">Admin Dashboard</h1>
      <Button className="inline-flex gap-2 mt-6" asChild>
        <Link href="/admin-dashboard/new-product">
          <PlusCircleIcon />
          Add New Product
        </Link>
      </Button>
      {/* <PropertiesTable data={data} totalPages={totalPages} page={page} /> */}
    </div>
  );
};

export default AdminDashboard;
