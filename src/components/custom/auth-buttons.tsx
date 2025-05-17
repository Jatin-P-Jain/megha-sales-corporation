"use client";

import { useAuth } from "@/context/useAuth";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Image from "next/image";
import useIsMobile from "@/hooks/useIsMobile";
import { MenuIcon } from "lucide-react";

export default function AuthButtons() {
  const auth = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="">
      {!!auth?.currentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-full">
            <Avatar className="size-9 ring-1">
              {!!auth?.currentUser?.photoURL && (
                <Image
                  src={auth?.currentUser?.photoURL}
                  alt={`${auth?.currentUser?.displayName} avatar`}
                  width={100}
                  height={100}
                  className=""
                />
              )}
              <AvatarFallback className="bg-cyan-800">
                {(auth.currentUser.displayName || auth.currentUser.email)?.[0]}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-4">
            <DropdownMenuLabel className="flex flex-col items-start gap-1">
              <div>{auth.currentUser.displayName}</div>
              <div className="text-xs font-normal">
                {auth.currentUser.email}
              </div>
              {auth.currentUser.phoneNumber && (
                <div className="text-xs font-normal">
                  +91-
                  <span className="font-semibold">
                    {auth.currentUser.phoneNumber?.split("+91")[1]}
                  </span>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">My Account</Link>
            </DropdownMenuItem>
            {!!auth.customClaims?.admin && (
              <DropdownMenuItem asChild>
                <Link href="/admin-dashboard">Admin Dashboard</Link>
              </DropdownMenuItem>
            )}
            {!auth.customClaims?.admin && (
              <DropdownMenuItem asChild>
                <Link href="/account/order-history">Order History</Link>
              </DropdownMenuItem>
            )}
            {!auth.customClaims?.admin && (
              <DropdownMenuItem asChild>
                <Link href="/account/saved-items">Saved for Later</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={async () => {
                await auth.logout();
                window.location.assign("/");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {!auth?.currentUser &&
        (isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex h-fit items-center justify-center pt-2">
                <MenuIcon className="flex items-center justify-center" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4">
              <DropdownMenuItem asChild>
                <Link href="/login" className="uppercase hover:underline">
                  Login
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register" className="uppercase hover:underline">
                  Signup
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 text-sm md:gap-4 md:text-base">
            <Link href="/login" className="uppercase hover:underline">
              Login
            </Link>
            <div className="h-8 w-[1px] bg-white/50"></div>
            <Link href="/register" className="uppercase hover:underline">
              Signup
            </Link>
          </div>
        ))}
    </div>
  );
}
