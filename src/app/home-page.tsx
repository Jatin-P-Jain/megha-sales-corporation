"use client";
import React from "react";
import { useAuth } from "@/context/useAuth";
import { CheckCircle, Loader2Icon, TriangleAlert, XCircle } from "lucide-react";
import BrandsGrid from "./brands-grid";
import { Brand } from "@/types/brand";
import Link from "next/link";
import { PushHandler } from "@/lib/firebase/push-handler";
import { Alert, AlertDescription } from "@/components/ui/alert";

const HomePage = ({
  brandsPromise,
}: {
  brandsPromise: Promise<{
    data: Brand[];
    totalPages?: number;
    totalItems?: number;
  }>;
}) => {
  const auth = useAuth();
  const { clientUser, clientUserLoading, currentUser } = auth;
  const user = clientUser;
  const { displayName } = user ?? {};
  const userName = displayName ?? "Guest";
  const isAdmin = clientUser?.userType === "admin";
  const accountStatus = clientUser?.accountStatus;
  const rejectionReason = clientUser?.rejectionReason;

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
            {!isAdmin && accountStatus === "pending" && (
              <div className="flex w-3/4 cursor-pointer items-center justify-center gap-3 rounded-lg border-1 border-yellow-700 p-1 px-2 text-center text-sm font-semibold text-yellow-700 shadow-md">
                <TriangleAlert className="size-4" />
                Account Approval Pending
              </div>
            )}
            {accountStatus === "rejected" && (
              <Alert className={"border-red-700 bg-red-50 text-red-700"}>
                <XCircle className={"h-4 w-4 text-red-700"} />
                <AlertDescription className={"ml-2 text-sm text-red-700"}>
                  <span className="font-semibold">{rejectionReason}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <BrandsGrid brandsPromise={brandsPromise} />
        </>
      )}
    </>
  );
};

export default HomePage;
