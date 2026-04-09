import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Package, MessageSquareMore, BookOpen } from "lucide-react";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import type { UserRole } from "@/types/userGate";

const AdminDashboard = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const userRole = (verifiedToken?.userRole ?? "admin") as UserRole;

  // Access matrix
  const isFullAdmin = userRole === "admin";
  const showBrands = isFullAdmin || userRole === "accountant";
  const showUsers = isFullAdmin;
  const showEnquiries = isFullAdmin;
  const showOrderBook = true; // all staff

  return (
    <div className="container mx-auto flex max-w-4xl flex-col gap-4 p-2">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage your application from here
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Directory — admin only */}
        {showUsers && (
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Directory
              </CardTitle>
              <CardDescription>
                View and manage user accounts, approve or reject requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <SafeLink href="/admin-dashboard/users">
                  <Users className="h-4 w-4" />
                  Manage Users
                </SafeLink>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Brand Catalogue — admin + accountant */}
        {showBrands && (
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Brand Catalogue
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
        )}

        {/* Order Book — visible to all staff */}
        {showOrderBook && (
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Order Book
              </CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <SafeLink href="/order-history">
                  <BookOpen className="h-4 w-4" />
                  View Orders
                </SafeLink>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enquiry Register — admin only */}
        {showEnquiries && (
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareMore className="h-5 w-5" />
                Enquiry Register
              </CardTitle>
              <CardDescription>
                View and manage enquiries, respond to user queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <SafeLink href="/enquiries">
                  <MessageSquareMore className="h-4 w-4" />
                  View Enquiries
                </SafeLink>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
