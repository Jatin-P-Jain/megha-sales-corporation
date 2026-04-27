"use client";
import { useAuthActions, useAuthState } from "@/context/useAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import DefaultUserIcon from "@/assets/icons/user.png";
import { Badge } from "../ui/badge";
import Image from "next/image";
import {
  BellRing,
  ClipboardList,
  DownloadIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  MessageCircleQuestionIcon,
  ShieldUserIcon,
  ShoppingCartIcon,
  TagsIcon,
  TriangleAlert,
  UserRound,
  CheckCircle2,
  XCircle,
  ShieldOff,
  UserX,
  Clock,
  AlertCircle,
  BriefcaseBusiness,
  Shield,
  UserPen,
  Truck,
} from "lucide-react";
import { usePwaPrompt } from "@/hooks/usePwaPrompt";
import clsx from "clsx";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { useUserGate } from "@/context/UserGateProvider";
import { SafeLink } from "./utility/SafeLink";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import NotificationsCenterClient from "@/app/notifications/notifications-center-client";
import { useNavigationLock } from "@/context/navigation-lock-provider";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartState } from "@/context/cartContext";

type AccountStatusUI =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "incomplete";

function toTitleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getStatusMeta(status?: string) {
  const s = (status ?? "unknown") as AccountStatusUI;

  switch (s) {
    case "approved":
      return {
        key: "approved" as const,
        label: "Approved",
        Icon: CheckCircle2,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        subtle: "text-green-700",
      };
    case "rejected":
      return {
        key: "rejected" as const,
        label: "Rejected",
        Icon: XCircle,
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        subtle: "text-red-700",
      };
    case "suspended":
      return {
        key: "suspended" as const,
        label: "Suspended",
        Icon: ShieldOff,
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
        subtle: "text-orange-700",
      };
    case "pending":
      return {
        key: "pending" as const,
        label: "Pending approval",
        Icon: Clock,
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        subtle: "text-yellow-700",
      };
    case "incomplete":
      return {
        key: "incomplete" as const,
        label: "Incomplete Profile",
        Icon: TriangleAlert,
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        subtle: "text-yellow-700",
      };
    default:
      return {
        key: "unknown" as const,
        label: "Unknown status",
        Icon: AlertCircle,
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        subtle: "text-yellow-700",
      };
  }
}

function AccountStatusBadge({
  status,
  compact,
}: {
  status?: string | null;
  compact?: boolean;
}) {
  const meta = getStatusMeta(status ?? undefined);
  const Icon = meta.Icon;

  return (
    <Badge className={meta.className}>
      <Icon className="h-3 w-3" />
      {compact ? toTitleCase(meta.key) : meta.label}
    </Badge>
  );
}

export default function AuthButtons() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isNavigating } = useNavigationLock();
  const { deferredPrompt, promptToInstall, isPwa } = usePwaPrompt();

  const { currentUser, isAdmin, isLoggingOut } = useAuthState();
  const { logout } = useAuthActions();
  const { profileComplete, accountStatus, userRole } = useUserGate();
  useRequireUserProfile(true);
  const { clientUser, clientUserLoading } = useUserProfileState();
  const { unreadCount: unreadNotifications } = useRealtimeNotifications({
    uid: currentUser?.uid,
    includeItems: false,
  });
  const { cartTotals } = useCartState();
  const { totalItems } = cartTotals;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchKey = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [isNavigating]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname, searchKey]);

  useEffect(() => {
    if (isMenuOpen) {
      setIsNotificationsOpen(false);
    }
  }, [isMenuOpen]);

  // 1) Loading state₹
  if (currentUser && clientUserLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2Icon className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // 2) Logged-in state
  if (clientUser) {
    return (
      <>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild className="">
            <button className="relative flex flex-col items-center">
              <Avatar
                className={clsx(
                  "size-8 bg-white ring-2",
                  isAdmin && "ring-1",
                  (!isAdmin && accountStatus === "pending") ||
                    (!profileComplete && "ring-yellow-500"),
                  !isAdmin && accountStatus === "rejected" && "ring-red-500",
                  !isAdmin &&
                    accountStatus === "suspended" &&
                    "ring-orange-500",
                )}
              >
                {clientUser.photoUrl ? (
                  <AvatarFallback className="bg-transparent p-0">
                    <Image
                      src={clientUser.photoUrl}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="h-full w-full rounded-full object-cover"
                      unoptimized={clientUser.photoUrl.startsWith("blob:")}
                    />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-cyan-800">
                    <Image
                      src={DefaultUserIcon}
                      alt="avatar"
                      width={60}
                      height={60}
                      className="rounded-full object-center p-1"
                    />
                  </AvatarFallback>
                )}
              </Avatar>

              {unreadNotifications > 0 && (
                <span
                  className={clsx(
                    "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-600 text-white",
                    isAdmin
                      ? "h-4 min-w-4 px-0.5 text-[9px] font-bold"
                      : "h-4 w-4 animate-pulse",
                  )}
                >
                  {isAdmin ? (
                    unreadNotifications > 99 ? (
                      "99+"
                    ) : (
                      unreadNotifications
                    )
                  ) : (
                    <BellRing className="h-3 w-3 p-0" />
                  )}
                </span>
              )}

              {isAdmin &&
                (() => {
                  const role = userRole ?? "admin";
                  const Icon =
                    role === "accountant"
                      ? UserPen
                      : role === "sales"
                        ? BriefcaseBusiness
                        : role === "dispatcher"
                          ? Truck
                          : Shield;
                  const bg =
                    role === "accountant"
                      ? "bg-violet-700"
                      : role === "sales"
                        ? "bg-emerald-700"
                        : role === "dispatcher"
                          ? "bg-amber-600"
                          : "bg-sky-900";
                  return (
                    <span
                      className={clsx(
                        "bottom-0 flex items-center gap-0.5 rounded-sm px-1 text-[8px] font-semibold text-white",
                        bg,
                      )}
                    >
                      <Icon className="size-2.5" />
                      {toTitleCase(role)}
                    </span>
                  );
                })()}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-80 rounded-md border p-1 shadow-lg"
          >
            <DropdownMenuLabel className="flex flex-col items-start space-y-1 px-4 py-2">
              <div className="flex w-full items-center justify-between">
                {clientUser.displayName && (
                  <span className="font-medium">{clientUser.displayName}</span>
                )}
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  {!isAdmin ? (
                    <>
                      {!profileComplete ? (
                        <AccountStatusBadge status={"incomplete"} />
                      ) : (
                        <AccountStatusBadge status={accountStatus} />
                      )}
                    </>
                  ) : null}
                </div>
              </div>
              {clientUser.email && (
                <span className="text-muted-foreground text-xs">
                  {clientUser.email}
                </span>
              )}

              {clientUser.phone && (
                <span className="text-muted-foreground text-xs">
                  +91-{clientUser.phone}
                </span>
              )}

              {isAdmin &&
                (() => {
                  const role = userRole ?? "admin";
                  const Icon =
                    role === "accountant"
                      ? UserPen
                      : role === "sales"
                        ? BriefcaseBusiness
                        : role === "dispatcher"
                          ? Truck
                          : Shield;
                  const bg =
                    role === "accountant"
                      ? "bg-violet-700"
                      : role === "sales"
                        ? "bg-emerald-700"
                        : role === "dispatcher"
                          ? "bg-amber-600"
                          : "bg-sky-900";
                  return (
                    <Badge
                      className={clsx(
                        "w-fit gap-1 border border-white font-medium text-white shadow-sm",
                        bg,
                      )}
                    >
                      <Icon className="size-3" />
                      {toTitleCase(role)}
                    </Badge>
                  );
                })()}

              {profileComplete &&
                !isAdmin &&
                accountStatus &&
                accountStatus !== "approved" &&
                accountStatus !== "pending" && (
                  <div className="mt-1 flex w-full items-center gap-1 text-xs text-zinc-600">
                    <TriangleAlert className="size-4" />
                    <span>
                      {accountStatus === "rejected"
                        ? "Your account was rejected."
                        : "Your account is suspended."}
                    </span>
                  </div>
                )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setIsMenuOpen(false);
                setIsNotificationsOpen(true);
              }}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center justify-start gap-2">
                Notification Center
                {unreadNotifications > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </div>
              <BellRing className="text-secondary-foreground size-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <SafeLink
                href="/account"
                className="flex items-center justify-between"
              >
                My Account
                <UserRound className="text-secondary-foreground" />
              </SafeLink>
            </DropdownMenuItem>

            {isAdmin ? (
              <>
                <DropdownMenuItem asChild>
                  <SafeLink
                    href="/admin-dashboard"
                    className="flex items-center justify-between"
                  >
                    Dashboard
                    <ShieldUserIcon className="text-secondary-foreground" />
                  </SafeLink>
                </DropdownMenuItem>

                <DropdownMenuItem asChild disabled>
                  <SafeLink
                    href="/change-pricing"
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      Change Pricing Structure
                      <span className="w-1/2 text-xs whitespace-nowrap">
                        (Coming Soon)
                      </span>
                    </div>
                    <TagsIcon className="text-secondary-foreground" />
                  </SafeLink>
                </DropdownMenuItem>
              </>
            ) : (
              <div>
                <DropdownMenuItem asChild>
                  <SafeLink
                    href="/cart"
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center justify-start gap-2">
                      My Cart{" "}
                      {totalItems > 0 && (
                        <span className="font-medium">
                          ({totalItems} item{totalItems !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                    <ShoppingCartIcon className="text-secondary-foreground" />
                  </SafeLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  disabled={!profileComplete || accountStatus !== "approved"}
                >
                  <SafeLink
                    href="/order-history"
                    className="flex items-center justify-between"
                  >
                    Order History
                    <ClipboardList className="text-secondary-foreground" />
                  </SafeLink>
                </DropdownMenuItem>
              </div>
            )}

            <DropdownMenuSeparator />

            {!isAdmin && (
              <DropdownMenuItem className="flex items-center justify-between">
                <SafeLink
                  href="/enquiries"
                  className="flex w-full items-center justify-between"
                >
                  Help Center
                  <MessageCircleQuestionIcon className="text-secondary-foreground" />
                </SafeLink>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="flex items-center justify-between"
              onClick={promptToInstall}
              disabled={isPwa || !deferredPrompt}
            >
              Install app <DownloadIcon className="text-secondary-foreground" />
            </DropdownMenuItem>

            {isPwa && (
              <span className="text-muted-foreground px-2 text-xs">
                Already using the app.
              </span>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center justify-between font-medium text-red-700 hover:bg-red-500"
              onClick={() => logout()}
            >
              Logout <LogOutIcon className="text-red-700" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationsCenterClient
          open={isNotificationsOpen}
          onOpenChange={setIsNotificationsOpen}
          onNavigate={() => {
            setIsMenuOpen(false);
            setIsNotificationsOpen(false);
          }}
        />

        {isLoggingOut && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30">
            <div className="bg-primary flex flex-col items-center rounded-lg p-4">
              <Loader2Icon className="mb-2 h-8 w-8 animate-spin" />
              <span className="text-sm">Logging you out…</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // 3) Logged-out state
  return (
    <SafeLink
      href="/login"
      className="flex flex-col-reverse items-center justify-center text-[10px] font-medium hover:underline md:flex-row md:text-base"
    >
      Login <LogInIcon className="size-5" />
    </SafeLink>
  );
}
