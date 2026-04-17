"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  UserX,
  ChevronDown,
  TriangleAlert,
  SlidersHorizontal,
  X,
  CheckSquare,
  ListCheck,
  ShieldCheck,
  ShieldOff,
  MousePointerClick,
  Loader2,
} from "lucide-react";
import SearchUser from "./search-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { AccountStatus } from "@/types/userGate";
import useIsMobile from "@/hooks/useIsMobile";
import { useDrawerBackButton } from "@/hooks/useDrawerBackButton";
import clsx from "clsx";

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending", color: "text-yellow-600" },
  approved: { icon: CheckCircle, label: "Approved", color: "text-green-600" },
  rejected: { icon: XCircle, label: "Rejected", color: "text-red-600" },
  suspended: {
    icon: ShieldAlert,
    label: "Suspended",
    color: "text-orange-600",
  },
  deactivated: { icon: UserX, label: "Deactivated", color: "text-gray-600" },
} as const;

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AccountStatus[];

const UserSearchAndFilters: React.FC = () => {
  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "accountStatus" | "profileStatus" | "adminAccounts"
  >("accountStatus");
  // Pending state — only committed to URL when user taps "Apply"
  const [pendingStatuses, setPendingStatuses] = useState<AccountStatus[]>([]);
  const [pendingProfileFilter, setPendingProfileFilter] = useState<
    "all" | "incompleteOnly" | "hideIncomplete"
  >("all");
  const [pendingAdminFilter, setPendingAdminFilter] = useState<
    "all" | "adminsOnly" | "hideAdmins"
  >("all");
  const { markNavigated } = useDrawerBackButton(drawerOpen, () =>
    setDrawerOpen(false),
  );
  const [isPending, startTransition] = useTransition();

  // ── Account Status ──────────────────────────────────────────────
  const selectedStatuses = useMemo(() => {
    const raw = searchParams.get("accountStatus");
    if (!raw) return [] as AccountStatus[];
    const set = new Set(raw.split(","));
    return ALL_STATUSES.filter((s) => set.has(s));
  }, [searchParams]);

  const setStatuses = (next: AccountStatus[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("accountStatus", next.join(","));
    else params.delete("accountStatus");
    params.delete("page");
    router.push(`?${params.toString()}`, { allowDuringNav: true });
  };

  const toggleStatus = (status: AccountStatus) => {
    const isSelected = selectedStatuses.includes(status);
    const next = isSelected
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    setStatuses(next);
  };

  const clearStatuses = () => setStatuses([]);

  // ── Profile Status ──────────────────────────────────────────────
  const incompleteOnly = searchParams.get("incompleteOnly") === "true";
  const hideIncomplete = searchParams.get("hideIncomplete") === "true";
  const profileFilter = incompleteOnly
    ? "incompleteOnly"
    : hideIncomplete
      ? "hideIncomplete"
      : "all";

  const setProfileFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("incompleteOnly");
    params.delete("hideIncomplete");
    if (val === "incompleteOnly") params.set("incompleteOnly", "true");
    if (val === "hideIncomplete") params.set("hideIncomplete", "true");
    params.delete("page");
    router.push(`?${params.toString()}`, { allowDuringNav: true });
  };

  // ── Admin Accounts ───────────────────────────────────────────────
  const adminsOnly = searchParams.get("adminsOnly") === "true";
  const hideAdmins = searchParams.get("hideAdmins") === "true";
  const adminFilter = adminsOnly
    ? "adminsOnly"
    : hideAdmins
      ? "hideAdmins"
      : "all";

  const setAdminFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("adminsOnly");
    params.delete("hideAdmins");
    params.delete("showAdmins");
    if (val === "adminsOnly") params.set("adminsOnly", "true");
    if (val === "hideAdmins") params.set("hideAdmins", "true");
    params.delete("page");
    router.push(`?${params.toString()}`, { allowDuringNav: true });
  };

  // ── Active filter counts ────────────────────────────────────────
  const totalActiveFilters =
    selectedStatuses.length +
    (profileFilter !== "all" ? 1 : 0) +
    (adminFilter !== "all" ? 1 : 0);

  // ── Drawer helpers (pending-state pattern) ──────────────────────
  // Sync pending state only when the drawer transitions from closed → open.
  // Using a ref+effect avoids re-syncing during the closing animation (which
  // would overwrite pending state before router.push completes).
  const prevDrawerOpen = React.useRef(false);
  React.useEffect(() => {
    if (drawerOpen && !prevDrawerOpen.current) {
      setPendingStatuses(selectedStatuses);
      setPendingProfileFilter(
        profileFilter as "all" | "incompleteOnly" | "hideIncomplete",
      );
      setPendingAdminFilter(adminFilter as "all" | "adminsOnly" | "hideAdmins");
    }
    prevDrawerOpen.current = drawerOpen;
    // Only run when drawerOpen changes; intentionally not listing filter
    // derivations to avoid re-syncing while drawer is already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  const applyDrawerFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (pendingStatuses.length)
      params.set("accountStatus", pendingStatuses.join(","));
    else params.delete("accountStatus");
    params.delete("incompleteOnly");
    params.delete("hideIncomplete");
    if (pendingProfileFilter === "incompleteOnly")
      params.set("incompleteOnly", "true");
    if (pendingProfileFilter === "hideIncomplete")
      params.set("hideIncomplete", "true");
    params.delete("adminsOnly");
    params.delete("hideAdmins");
    if (pendingAdminFilter === "adminsOnly") params.set("adminsOnly", "true");
    if (pendingAdminFilter === "hideAdmins") params.set("hideAdmins", "true");
    params.delete("page");
    // Close first so the Drawer's onOpenChange doesn't re-sync pending state
    markNavigated();
    setDrawerOpen(false);
    startTransition(() => {
      router.push(`?${params.toString()}`, { allowDuringNav: true });
    });
  };

  const togglePendingStatus = (status: AccountStatus) => {
    const isSelected = pendingStatuses.includes(status);
    setPendingStatuses(
      isSelected
        ? pendingStatuses.filter((s) => s !== status)
        : [...pendingStatuses, status],
    );
  };

  // ── Shared inner panels (use pending state for mobile drawer) ────
  const AccountStatusPanel = (
    <div className="flex flex-col gap-1 p-1">
      <button
        className={clsx(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100",
          pendingStatuses.length === 0 && "bg-gray-100 font-medium",
        )}
        onClick={() => setPendingStatuses([])}
      >
        <span className="flex items-center gap-2">
          <ListCheck className="text-primary size-5" />
          All statuses
        </span>
        {pendingStatuses.length === 0 && (
          <CheckSquare className="text-primary size-4" />
        )}
      </button>
      {ALL_STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const Icon = cfg.icon;
        const checked = pendingStatuses.includes(status);
        return (
          <button
            key={status}
            className={clsx(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100",
              checked && "bg-primary/10 font-medium",
            )}
            onClick={() => togglePendingStatus(status)}
          >
            <span className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              {cfg.label}
            </span>
            {checked && <CheckSquare className="text-primary size-4" />}
          </button>
        );
      })}
    </div>
  );

  const ProfileStatusPanel = (
    <div className="flex flex-col gap-1 p-1">
      {(
        [
          {
            value: "all",
            label: "All profiles",
            icon: <ListCheck className="text-primary size-5" />,
          },
          {
            value: "incompleteOnly",
            label: "Show Incomplete Profiles Only",
            icon: <TriangleAlert className="h-4 w-4 text-yellow-600" />,
          },
          {
            value: "hideIncomplete",
            label: "Hide Incomplete Profiles",

            icon: <CheckCircle2 className="size-5 text-green-600" />,
          },
        ] as const
      ).map(({ value, label, icon }) => {
        const active = pendingProfileFilter === value;
        return (
          <button
            key={value}
            className={clsx(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100",
              active && "bg-primary/10 font-medium",
            )}
            onClick={() => setPendingProfileFilter(value)}
          >
            <span className="flex items-center gap-2">
              {icon}
              {label}
            </span>
            {active && <CheckSquare className="text-primary h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );

  const AdminAccountsPanel = (
    <div className="flex flex-col gap-1 p-1">
      {(
        [
          {
            value: "all",
            label: "All accounts",
            icon: <ListCheck className="text-primary size-5" />,
          },
          {
            value: "adminsOnly",
            label: "Show Admin Accounts Only",
            icon: <ShieldCheck className="size-5 text-blue-900" />,
          },
          {
            value: "hideAdmins",
            label: "Hide Admin Accounts",

            icon: <ShieldOff className="size-5 text-gray-500" />,
          },
        ] as const
      ).map(({ value, label, icon }) => {
        const active = pendingAdminFilter === value;
        return (
          <button
            key={value}
            className={clsx(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100",
              active && "bg-primary/10 font-medium",
            )}
            onClick={() => setPendingAdminFilter(value)}
          >
            <span className="flex items-center gap-2">
              {icon}
              {label}
            </span>
            {active && <CheckSquare className="text-primary size-4" />}
          </button>
        );
      })}
    </div>
  );

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("accountStatus");
    params.delete("incompleteOnly");
    params.delete("hideIncomplete");
    params.delete("adminsOnly");
    params.delete("hideAdmins");
    params.delete("showAdmins");
    params.delete("page");
    startTransition(() => {
      router.push(`?${params.toString()}`, { allowDuringNav: true });
    });
  };

  // ── Mobile Drawer ───────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <SearchUser variant="outline" showText={true} />
          <div className="flex items-center gap-1">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <div className="border-primary flex rounded-md border">
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className={clsx(
                      "flex items-center gap-2 border-0 outline-none focus:ring-0",
                      totalActiveFilters > 0 && "text-primary",
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {totalActiveFilters > 0 && (
                      <span className="bg-primary text-primary-foreground ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold">
                        {totalActiveFilters}
                      </span>
                    )}
                  </Button>
                </DrawerTrigger>
                {totalActiveFilters > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="inline-flex h-9 w-9 text-red-700"
                    onClick={clearAllFilters}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <DrawerContent className="flex max-h-[85vh] flex-col overflow-hidden">
                <DrawerHeader className="shrink-0 pb-0">
                  <DrawerTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </DrawerTitle>
                </DrawerHeader>

                {/* Tabs */}
                <div className="no-scrollbar shrink-0 px-4 pt-2 pb-3">
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {(
                      [
                        {
                          key: "accountStatus" as const,
                          label: "Account Status",
                          count: pendingStatuses.length,
                        },
                        {
                          key: "profileStatus" as const,
                          label: "Profile Status",
                          count: pendingProfileFilter !== "all" ? 1 : 0,
                        },
                        {
                          key: "adminAccounts" as const,
                          label: "Admin Accounts",
                          count: pendingAdminFilter !== "all" ? 1 : 0,
                        },
                      ] as const
                    ).map(({ key, label, count }) => (
                      <Button
                        key={key}
                        type="button"
                        variant={activeTab === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab(key)}
                        className={clsx(
                          "shrink-0 text-xs",
                          count > 0 &&
                            activeTab !== key &&
                            "border-primary bg-primary/10 text-primary",
                        )}
                      >
                        <span>{label}</span>
                        {count > 0 && <span>({count})</span>}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Panel */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4">
                  {activeTab === "accountStatus"
                    ? AccountStatusPanel
                    : activeTab === "profileStatus"
                      ? ProfileStatusPanel
                      : AdminAccountsPanel}
                </div>

                <DrawerFooter className="flex shrink-0 flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={() => {
                      if (activeTab === "accountStatus") setPendingStatuses([]);
                      else if (activeTab === "profileStatus")
                        setPendingProfileFilter("all");
                      else if (activeTab === "adminAccounts")
                        setPendingAdminFilter("all");
                    }}
                    disabled={
                      (activeTab === "accountStatus" &&
                        pendingStatuses.length === 0) ||
                      (activeTab === "profileStatus" &&
                        pendingProfileFilter === "all") ||
                      (activeTab === "adminAccounts" &&
                        pendingAdminFilter === "all")
                    }
                  >
                    <X className="h-4 w-4" /> Clear
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={applyDrawerFilters}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Applying…
                      </>
                    ) : (
                      <>
                        Apply <MousePointerClick className="size-5" />
                      </>
                    )}
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop: two dropdowns ──────────────────────────────────────
  const profileStatusLabel =
    profileFilter === "all"
      ? "Profile Status"
      : profileFilter === "incompleteOnly"
        ? "Incomplete only"
        : "Hide incomplete";

  const adminFilterLabel =
    adminFilter === "all"
      ? "Admin Accounts"
      : adminFilter === "adminsOnly"
        ? "Admins only"
        : "Hide admins";

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto] gap-4 md:items-center md:gap-8">
        <SearchUser variant="outline" showText={true} />
        <div className="flex flex-wrap items-center justify-end gap-1">
          <span className="text-muted-foreground mr-2 inline text-sm">
            Filters:
          </span>
          {/* Show Admins */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={clsx(
                  "flex items-center gap-2",
                  adminFilter !== "all" && "border-primary",
                )}
              >
                {adminFilter === "adminsOnly" && (
                  <ShieldCheck className="h-4 w-4 text-blue-900" />
                )}
                {adminFilter === "hideAdmins" && (
                  <ShieldOff className="h-4 w-4 text-gray-500" />
                )}
                {adminFilterLabel}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-80"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>Admin Accounts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                [
                  {
                    value: "all",
                    label: "All accounts",
                    icon: <ListCheck className="text-primary h-4 w-4" />,
                  },
                  {
                    value: "adminsOnly",
                    label: "Show Admin Accounts Only",
                    icon: <ShieldCheck className="h-4 w-4 text-blue-900" />,
                  },
                  {
                    value: "hideAdmins",
                    label: "Hide Admin Accounts",
                    icon: <ShieldOff className="h-4 w-4 text-gray-500" />,
                  },
                ] as const
              ).map(({ value, label, icon }) => (
                <DropdownMenuItem
                  key={value}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setAdminFilter(value)}
                >
                  <span className="flex items-center gap-2">
                    {icon}
                    {label}
                  </span>
                  <span className="pointer-events-none flex items-center justify-center">
                    {adminFilter === value && (
                      <CheckSquare className="text-primary size-4" />
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={clsx(
                  "flex items-center gap-2",
                  profileFilter !== "all" && "border-primary",
                )}
              >
                {profileFilter === "incompleteOnly" && (
                  <TriangleAlert className="h-4 w-4 text-yellow-600" />
                )}
                {profileFilter === "hideIncomplete" && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {profileStatusLabel}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-80"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>Profile Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                [
                  {
                    value: "all",
                    label: "All profiles",
                    icon: <ListCheck className="text-primary h-4 w-4" />,
                  },
                  {
                    value: "incompleteOnly",
                    label: "Show Incomplete Profiles Only",
                    icon: <TriangleAlert className="h-4 w-4 text-yellow-600" />,
                  },
                  {
                    value: "hideIncomplete",
                    label: "Hide Incomplete Profiles",
                    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                  },
                ] as const
              ).map(({ value, label, icon }) => (
                <DropdownMenuItem
                  key={value}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setProfileFilter(value)}
                >
                  <span className="flex items-center gap-2">
                    {icon}
                    {label}
                  </span>
                  <span className="pointer-events-none flex items-center justify-center">
                    {profileFilter === value && (
                      <CheckSquare className="text-primary size-4" />
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Account Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={clsx(
                  "flex items-center gap-2",
                  selectedStatuses.length > 0 && "border-primary text-primary",
                )}
              >
                Account Status
                {selectedStatuses.length > 0 && (
                  <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold">
                    {selectedStatuses.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-80"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>Account Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between px-3 py-2 text-sm"
                onSelect={(e) => e.preventDefault()}
                onClick={clearStatuses}
              >
                <span className="flex items-center gap-2">
                  <ListCheck className="text-primary h-4 w-4" />
                  All statuses
                </span>
                <span className="pointer-events-none flex items-center justify-center">
                  {selectedStatuses.length === 0 && (
                    <CheckSquare className="text-primary size-4" />
                  )}
                </span>
              </DropdownMenuItem>
              {ALL_STATUSES.map((status) => {
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.icon;
                const checked = selectedStatuses.includes(status);
                return (
                  <DropdownMenuItem
                    key={status}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => toggleStatus(status)}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      {cfg.label}
                    </span>
                    <span className="pointer-events-none flex items-center justify-center">
                      {checked && (
                        <CheckSquare className="text-primary size-4" />
                      )}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {totalActiveFilters > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 px-2 text-red-700 hover:bg-red-50 hover:text-red-700"
              onClick={clearAllFilters}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchAndFilters;
