"use client";
import React from "react";
import { useAuth } from "@/context/useAuth";
import { Loader2Icon } from "lucide-react";
import BrandsGrid from "./brands-grid";
import { Brand } from "@/types/brand";

const HomePage = ({
  brandsPromise,
}: {
  brandsPromise: Promise<{ data: Brand[]; totalPages: number }>;
}) => {
  const auth = useAuth();
  const { clientUser, clientUserLoading, currentUser } = auth;
  const user = clientUser;
  const { displayName } = user ?? {};
  const userName = displayName ?? "Guest";

  return (
    <>
      {currentUser && clientUserLoading ? (
        <div className="bg-muted text-muted-foreground mx-auto flex min-h-30 w-1/2 flex-col items-center justify-center gap-4 rounded-lg p-4">
          <Loader2Icon className="size-5 animate-spin" />
          <span className="text-sm font-semibold">Please wait...</span>
        </div>
      ) : (
        <>
          <h1 className="w-full text-lg font-semibold">
            Hello, <span className="text-xl font-bold">{userName}! 👋</span>
          </h1>
          <BrandsGrid brandsPromise={brandsPromise} />
        </>
      )}
    </>
  );
};

export default HomePage;
