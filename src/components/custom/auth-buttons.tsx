"use client";

import Link from "next/link";
import { useAuth } from "@/context/useAuth";
import useIsMobile from "@/hooks/useIsMobile";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Image from "next/image";
import {
  ClipboardList,
  HeartIcon,
  Loader2Icon,
  LogOutIcon,
  MenuIcon,
  ShieldUserIcon,
  ShoppingCartIcon,
  UserRound,
} from "lucide-react";

export default function AuthButtons() {
  const auth = useAuth();
  const { clientUser, clientUserLoading, logout, currentUser, isLoggingOut } =
    auth;
  const isMobile = useIsMobile();

  // Determine admin once
  const isAdmin = clientUser?.role === "admin";

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
          <DropdownMenuTrigger asChild>
            <button className="flex items-center">
              <Avatar className="h-9 w-9 ring-1">
                {clientUser.photoUrl ? (
                  <Image
                    src={clientUser.photoUrl}
                    alt="avatar"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-cyan-800">
                    {(clientUser.displayName || clientUser.email)?.[0] || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={4}>
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
              {clientUser.role && (
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-semibold">
                  {clientUser.role.charAt(0).toUpperCase() +
                    clientUser.role.slice(1)}
                </span>
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
              <DropdownMenuItem asChild>
                <Link
                  href="/admin-dashboard"
                  className="flex items-center justify-between"
                >
                  Admin Dashboard
                  <ShieldUserIcon className="text-secondary-foreground" />
                </Link>
              </DropdownMenuItem>
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
                    href="/account/order-history"
                    className="flex items-center justify-between"
                  >
                    Order History
                    <ClipboardList className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/account/saved-items"
                    className="flex items-center justify-between"
                  >
                    Saved for Later{" "}
                    <HeartIcon className="text-secondary-foreground" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center justify-between"
              onClick={() => {
                logout();
                window.location.assign("/");
              }}
            >
              Logout <LogOutIcon className="text-secondary-foreground" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>
            <MenuIcon className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem asChild>
            <Link href="/login">Login</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/register">Signup</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className="uppercase hover:underline">
        Login
      </Link>
      <span className="h-6 w-px bg-white/50" />
      <Link href="/register" className="uppercase hover:underline">
        Signup
      </Link>
    </div>
  );
}
