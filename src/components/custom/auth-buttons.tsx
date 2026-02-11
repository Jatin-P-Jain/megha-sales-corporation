"use client";

import Link from "next/link";
import { useAuth } from "@/context/useAuth";
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
  ClipboardList,
  DownloadIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  MessageCircleQuestionIcon,
  NotebookTextIcon,
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
} from "lucide-react";
import { usePwaPrompt } from "@/hooks/usePwaPrompt";
import { useState } from "react";
import HelpDialog from "./help-dialog";

type AccountStatusUI =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated";

function toTitleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getStatusMeta(status?: string) {
  const s = (status ?? "pending") as AccountStatusUI;

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
    case "deactivated":
      return {
        key: "deactivated" as const,
        label: "Deactivated",
        Icon: UserX,
        className: "bg-zinc-100 text-zinc-800 hover:bg-zinc-100",
        subtle: "text-zinc-700",
      };
    case "pending":
    default:
      return {
        key: "pending" as const,
        label: "Pending approval",
        Icon: Clock,
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        subtle: "text-yellow-700",
      };
  }
}

function AccountStatusBadge({
  status,
  compact,
}: {
  status?: string;
  compact?: boolean;
}) {
  const meta = getStatusMeta(status);
  const Icon = meta.Icon;

  return (
    <Badge className={meta.className}>
      <Icon className="h-3 w-3" />
      {compact ? toTitleCase(meta.key) : meta.label}
    </Badge>
  );
}

export default function AuthButtons() {
  const { deferredPrompt, promptToInstall, isPwa } = usePwaPrompt();
  const auth = useAuth();
  const { clientUser, clientUserLoading, logout, currentUser, isLoggingOut } =
    auth;

  const [helpOpen, setHelpOpen] = useState(false);

  const isAdmin = clientUser?.userType === "admin";
  const accountStatus = clientUser?.accountStatus;

  // 1) Loading state
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="">
            <button className="relative flex flex-col items-center">
              <Avatar className="h-6 w-6 bg-white ring-1 md:h-8 md:w-8">
                {clientUser.photoUrl ? (
                  <Image
                    src={clientUser.photoUrl}
                    alt="avatar"
                    width={100}
                    height={100}
                    className="rounded-full object-center"
                  />
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

              {isAdmin && (
                <div className="bottom-0 rounded-sm bg-green-100 px-1 text-[8px] font-semibold text-green-700">
                  Admin
                </div>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-50 md:w-80"
          >
            <DropdownMenuLabel className="flex flex-col items-start space-y-1 px-4 py-2">
              <span className="font-medium">{clientUser.displayName}</span>
              <span className="text-muted-foreground text-xs">
                {clientUser.email}
              </span>

              {clientUser.phone && (
                <span className="text-muted-foreground text-xs">
                  +91-{clientUser.phone}
                </span>
              )}

              <div className="flex w-full items-center justify-between gap-2">
                {clientUser.userType && (
                  <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-semibold">
                    {toTitleCase(clientUser.userType)}
                  </span>
                )}

                {!isAdmin && <AccountStatusBadge status={accountStatus} />}
              </div>

              {!isAdmin && accountStatus && accountStatus !== "approved" && (
                <div className="mt-1 flex w-full items-center gap-1 text-xs text-zinc-600">
                  <TriangleAlert className="size-4" />
                  <span>
                    {accountStatus === "pending"
                      ? "Your account is under review."
                      : accountStatus === "rejected"
                        ? "Your account was rejected."
                        : accountStatus === "suspended"
                          ? "Your account is suspended."
                          : "Your account is deactivated."}
                  </span>
                </div>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/account"
                className="flex items-center justify-between"
              >
                My Account
                <UserRound className="text-secondary-foreground" />
              </Link>
            </DropdownMenuItem>

            {isAdmin ? (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/order-history"
                    className="flex items-center justify-between"
                  >
                    Order Book
                    <NotebookTextIcon className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin-dashboard"
                    className="flex items-center justify-between"
                  >
                    Admin Dashboard
                    <ShieldUserIcon className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild disabled>
                  <Link
                    href="/change-pricing"
                    className="flex items-center justify-between"
                  >
                    Change Pricing Structure <br />
                    (Coming Soon)
                    <TagsIcon className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/cart"
                    className="flex items-center justify-between"
                  >
                    My Cart
                    <ShoppingCartIcon className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/order-history"
                    className="flex items-center justify-between"
                  >
                    Order History
                    <ClipboardList className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center justify-between"
              onClick={() => setTimeout(() => setHelpOpen(true), 0)}
            >
              Need help?
              <MessageCircleQuestionIcon className="text-secondary-foreground" />
            </DropdownMenuItem>

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
              className="flex items-center justify-between"
              onClick={() => logout()}
            >
              Logout <LogOutIcon className="text-secondary-foreground" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <HelpDialog
          open={helpOpen}
          onOpenChange={setHelpOpen}
          user={clientUser}
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
    <Link
      href="/login"
      className="flex items-center justify-center gap-1 hover:underline"
    >
      Login <LogInIcon className="size-4" />
    </Link>
  );
}
