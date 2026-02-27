import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Package, MessageSquareMore } from "lucide-react";
import UsersCardClient from "./users/users-unlock-client";
import { SafeLink } from "@/components/custom/utility/SafeLink";

const AdminDashboard = async () => {
  return (
    <div className="container mx-auto flex max-w-4xl flex-col gap-4 p-2">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage your application from here
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Brands Card */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Brands Management
            </CardTitle>
            <CardDescription>
              View, create, edit, and manage all brands in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <SafeLink href="/admin-dashboard/brands">
                <Package className="h-4 w-4" />
                Manage Brands
              </SafeLink>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              View and manage user accounts, approve or reject requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersCardClient />
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareMore className="h-5 w-5" />
              Enquiry Management
            </CardTitle>
            <CardDescription>
              View and manage enquiries, respond to user queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <SafeLink href="/admin-dashboard/enquiries">
                <MessageSquareMore className="h-4 w-4" />
                View Enquiries
              </SafeLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
