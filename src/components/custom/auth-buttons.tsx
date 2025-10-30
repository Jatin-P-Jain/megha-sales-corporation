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
  DownloadIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  MessageCircleQuestionIcon,
  NotebookTextIcon,
  ShieldUserIcon,
  ShoppingCartIcon,
  TagsIcon,
  UserRound,
} from "lucide-react";
import { usePwaPrompt } from "@/hooks/usePwaPrompt";
import { useState } from "react";
import HelpDialog from "./help-dialog";

export default function AuthButtons() {
  const { deferredPrompt, promptToInstall, isPwa } = usePwaPrompt();
  const auth = useAuth();
  const { clientUser, clientUserLoading, logout, currentUser, isLoggingOut } =
    auth;
  const isMobile = useIsMobile();

  const [helpOpen, setHelpOpen] = useState(false);

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
                    {(clientUser.displayName || clientUser.email)?.[0] || "U"}
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
                    Change Pricing Structure <br></br>(Coming Soon)
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
              onClick={() => {
                logout();
              }}
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
  if (isMobile) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center gap-1 hover:underline"
      >
        Login <LogInIcon className="size-4" />
      </Link>
      // <DropdownMenu>
      //   <DropdownMenuTrigger asChild>
      //     <button>
      //       <MenuIcon className="h-5 w-5" />
      //     </button>
      //   </DropdownMenuTrigger>
      //   <DropdownMenuContent align="end" sideOffset={4}>
      //     <DropdownMenuItem asChild>
      //       <Link href="/login">Login</Link>
      //     </DropdownMenuItem>
      //     <DropdownMenuItem asChild>
      //       <Link href="/register">Signup</Link>
      //     </DropdownMenuItem>
      //   </DropdownMenuContent>
      // </DropdownMenu>
    );
  }

  return (
    <div className="">
      <Link
        href="/login"
        className="flex items-center justify-center gap-1 hover:underline"
      >
        Login <LogInIcon className="size-4" />
      </Link>

      {/* <Link href="/register" className="uppercase hover:underline">
        Signup
      </Link> */}
    </div>
  );
}
