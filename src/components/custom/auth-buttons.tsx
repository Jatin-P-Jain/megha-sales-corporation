"use client";

import { useAuth } from "@/context/auth";
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
import { useRouter } from "next/navigation";

export default function AuthButtons() {
  const auth = useAuth();

  return (
    <div>
      {!!auth?.currentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="">
              {!!auth?.currentUser?.photoURL && (
                <Image
                  src={auth?.currentUser?.photoURL}
                  alt={`${auth?.currentUser?.displayName} avatar`}
                  width={70}
                  height={70}
                />
              )}
              <AvatarFallback className="bg-cyan-800 border-2">
                {(auth.currentUser.displayName || auth.currentUser.email)?.[0]}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-4">
            <DropdownMenuLabel>
              <div>{auth.currentUser.displayName}</div>
              <div className="font-normal text-xs">
                {auth.currentUser.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="#">My Account</Link>
            </DropdownMenuItem>
            {!!auth.customClaims?.admin && (
              <DropdownMenuItem asChild>
                <Link href="#">Order History</Link>
              </DropdownMenuItem>
            )}
            {!auth.customClaims?.admin && (
              <DropdownMenuItem asChild>
                {/* <Link href="/account/my-favourites">My Favourites</Link> */}
                <Link href="#">My Favourites</Link>
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
      {!auth?.currentUser && (
        <div className="flex gap-2 md:gap-4 items-center text-sm md:text-base">
          <Link href={"/login"} className="uppercase hover:underline">
            Login
          </Link>
          <div className="h-8 w-[1px] bg-white/50"></div>
          <Link href={"/register"} className="uppercase hover:underline">
            Signup
          </Link>
        </div>
      )}
    </div>
  );
}
