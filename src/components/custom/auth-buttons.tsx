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
import { useEffect, useState } from "react";
import { UserData } from "@/types/user";
import { Loader2Icon, MenuIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthButtons({ user }: { user: UserData | undefined }) {
  const router = useRouter();
  const auth = useAuth();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (user?.role === "admin") setIsAdmin(true);
  }, [user]);
  return (
    <>
      <div className="">
        {!!user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-full">
              <Avatar className="size-9 ring-1">
                {!!user?.photoUrl && (
                  <Image
                    src={user?.photoUrl}
                    alt={`${user?.displayName} avatar`}
                    width={100}
                    height={100}
                    className=""
                  />
                )}
                <AvatarFallback className="bg-cyan-800">
                  {(user.displayName || user.email)?.[0] || (
                    <Loader2Icon className="size-4 animate-spin" />
                  )}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4">
              <DropdownMenuLabel className="flex flex-col items-start gap-1">
                <div>{user.displayName}</div>
                <div className="text-xs font-normal">{user.email}</div>
                {user.phone && (
                  <div className="text-xs font-normal">
                    +91-
                    <span className="font-semibold">{user.phone}</span>
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">My Account</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin-dashboard">Admin Dashboard</Link>
                </DropdownMenuItem>
              )}
              {!isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/account/order-history">Order History</Link>
                </DropdownMenuItem>
              )}
              {!isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/account/saved-items">Saved for Later</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={async () => {
                  await auth.logout();
                  router.refresh();
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!user &&
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
    </>
  );
}
