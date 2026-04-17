"use client";

import { useAuthState } from "@/context/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Package, MessageSquareMore, BookOpen } from "lucide-react";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import type { UserRole } from "@/types/userGate";

export function AdminServiceCards({ userRole }: { userRole: UserRole }) {
  const { currentUser } = useAuthState();
  const { items } = useRealtimeNotifications({
    uid: currentUser?.uid,
    includeItems: true,
  });

  // Count unread notifications per type – used as per-card badges.
  const unreadByType = items.reduce<Record<string, number>>((acc, n) => {
    if (!n.read) {
      acc[n.type] = (acc[n.type] ?? 0) + 1;
    }
    return acc;
  }, {});

  const isFullAdmin = userRole === "admin";
  const showBrands = isFullAdmin || userRole === "accountant";
  const showUsers = isFullAdmin;
  const showEnquiries = isFullAdmin;

  function Badge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
      <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* User Directory — admin only */}
      {showUsers && (
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Directory
              <Badge count={unreadByType["account"] ?? 0} />
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
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Order Book
            <Badge count={unreadByType["order"] ?? 0} />
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

      {/* Enquiry Register — admin only */}
      {showEnquiries && (
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareMore className="h-5 w-5" />
              Enquiry Register
              <Badge count={unreadByType["enquiry"] ?? 0} />
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
  );
}
