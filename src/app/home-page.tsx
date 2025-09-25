"use client";
import React from "react";
import { useAuth } from "@/context/useAuth";
import { Loader2Icon } from "lucide-react";
import BrandsGrid from "./brands-grid";
import { Brand } from "@/types/brand";
import Link from "next/link";
import { PushHandler } from "@/lib/firebase/push-handler";

const HomePage = ({
  brandsPromise,
}: {
  brandsPromise: Promise<{
    data: Brand[];
    totalPages: number;
    totalItems: number;
  }>;
}) => {
  const auth = useAuth();
  const { clientUser, clientUserLoading, currentUser } = auth;
  const user = clientUser;
  const { displayName } = user ?? {};
  const userName = displayName ?? "Guest";
  const isAdmin = auth?.customClaims?.admin ?? false;

  return (
    <>
      <PushHandler />
      {currentUser && clientUserLoading ? (
        <div className="bg-muted text-muted-foreground mx-auto flex min-h-30 w-1/2 flex-col items-center justify-center gap-4 rounded-lg p-4">
          <Loader2Icon className="size-5 animate-spin" />
          <span className="text-sm font-semibold">Please wait...</span>
        </div>
      ) : (
        <>
          <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
            <h1 className="w-full text-lg font-semibold">
              Hello, <span className="text-xl font-bold">{userName}!</span>
            </h1>

            {isAdmin && (
              <Link
                href="/admin-dashboard"
                className="w-3/4 rounded-lg border-1 border-green-700 p-1 px-2 text-center text-sm font-semibold text-green-700"
              >
                Go to Admin Dasboard
              </Link>
            )}
          </div>
          <BrandsGrid brandsPromise={brandsPromise} />
        </>
      )}
    </>
  );
};

export default HomePage;
