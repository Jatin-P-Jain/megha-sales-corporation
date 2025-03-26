import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import PropertiesTable from "./properties-table";

const AdminDashboard = async ({
  searchParams,
}: {
  searchParams?: Promise<any>;
}) => {
  const searchParamsValue = await searchParams;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Dashboard" }]}></Breadcrumbs>
      <h1 className="text-4xl font-bold mt-6">Admin Dashboard</h1>
      <Button className="inline-flex gap-2 mt-6" asChild>
        <Link href="/admin-dashboard/new-property">
          <PlusCircleIcon />
          New Property
        </Link>
      </Button>
      <PropertiesTable
        page={searchParamsValue.page ? parseInt(searchParamsValue.page) : 1}
      />
    </div>
  );
};

export default AdminDashboard;
