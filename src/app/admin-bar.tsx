"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import { useAuthState } from "@/context/useAuth";
import { useUserGate } from "@/context/UserGateProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import type { UserRole } from "@/types/userGate";
import clsx from "clsx";
import {
  BookOpen,
  BriefcaseBusiness,
  LayoutDashboard,
  MessageSquareMore,
  Package,
  Shield,
  Truck,
  UserPen,
  Users,
} from "lucide-react";

export default function AdminBar() {
  const { currentUser, isAdmin } = useAuthState();
  const { userRole } = useUserGate();
  const { items } = useRealtimeNotifications({
    uid: currentUser?.uid,
    includeItems: true,
  });

  const role: UserRole =
    (userRole as UserRole | null) ?? (isAdmin ? "admin" : "customer");

  const isStaff = role !== "customer";
  if (!currentUser || !isStaff) return null;

  const isFullAdmin = role === "admin";
  const canManageBrands = isFullAdmin || role === "accountant";

  const unreadByType = items.reduce<Record<string, number>>((acc, n) => {
    if (!n.read) {
      acc[n.type] = (acc[n.type] ?? 0) + 1;
    }
    return acc;
  }, {});

  const shortcuts = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/admin-dashboard",
      icon: LayoutDashboard,
      visible: isFullAdmin || role === "sales",
      badgeCount: 0,
    },
    {
      key: "users",
      label: "Users",
      href: "/admin-dashboard/users",
      icon: Users,
      visible: isFullAdmin,
      badgeCount: unreadByType["account"] ?? 0,
    },
    {
      key: "brands",
      label: "Brands",
      href: "/admin-dashboard/brands",
      icon: Package,
      visible: canManageBrands,
      badgeCount: 0,
    },
    {
      key: "orders",
      label: "Orders",
      href: "/order-history",
      icon: BookOpen,
      visible: true,
      badgeCount: unreadByType["order"] ?? 0,
    },
    {
      key: "enquiries",
      label: "Enquiries",
      href: "/enquiries",
      icon: MessageSquareMore,
      visible: isFullAdmin || role === "sales",
      badgeCount: unreadByType["enquiry"] ?? 0,
    },
  ].filter((item) => item.visible);

  if (shortcuts.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 my-4 w-full gap-2 py-2">
      <CardHeader className="px-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold md:text-base">
          Admin Shortcuts
          <Badge
            variant="default"
            className={clsx(
              "border border-white py-1.5 font-medium shadow-md",
              role === "accountant"
                ? "bg-olive-600"
                : role === "sales"
                  ? "bg-emerald-700"
                  : role === "dispatcher"
                    ? "bg-amber-700"
                    : "bg-sky-900",
            )}
          >
            {role === "accountant" ? (
              <UserPen className="size-4" />
            ) : role === "sales" ? (
              <BriefcaseBusiness className="size-4" />
            ) : role === "dispatcher" ? (
              <Truck className="size-4" />
            ) : (
              <Shield className="size-4" />
            )}
            <span className="inline-flex text-[10px]">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Quick access to admin features and pending items.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {shortcuts.map(({ key, href, label, icon: Icon, badgeCount }) => (
            <Button
              key={key}
              asChild
              variant="outline"
              size="sm"
              className="h-9"
            >
              <SafeLink
                href={href}
                className="relative flex items-center gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
                {badgeCount > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </SafeLink>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
