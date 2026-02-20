"use client";
import React from "react";
import { useAuth } from "@/context/useAuth";
import {
  Loader2Icon,
  OctagonAlert,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import BrandsGrid from "./brands-grid";
import { Brand } from "@/types/brand";
import { PushHandler } from "@/lib/firebase/push-handler";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UserUnlockDialog from "@/components/custom/user-unlock-dialog";
import { Button } from "@/components/ui/button";

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
  const { displayName, phone } = user ?? {};
  const userName = displayName;
  const userPhone = phone;
  const isAdmin = clientUser?.userType === "admin";
  const accountStatus = clientUser?.accountStatus;
  const rejectionReason = clientUser?.rejectionReason;
  const profileComplete = clientUser && clientUser?.profileComplete;

  return (
    <>
      <PushHandler />
      {currentUser && clientUserLoading ? (
        <div className="bg-muted text-muted-foreground mx-auto flex h-full flex-col items-center justify-center gap-4 rounded-lg p-4">
          <Loader2Icon className="size-5 animate-spin" />
          <span className="text-sm font-semibold">
            We are fetching your account details...
          </span>
        </div>
      ) : (
        <>
          <div className="flex w-full items-center justify-between gap-4">
            <h1 className="w-full text-sm font-semibold md:text-lg">
              Hello,{" "}
              <span className="text-base font-bold md:text-xl">
                {userName || userPhone || "Guest"} 🙋🏻
              </span>
            </h1>
            {profileComplete && !isAdmin && accountStatus === "pending" && (
              <UserUnlockDialog>
                <Button
                  variant={"secondary"}
                  className="flex items-center justify-center gap-3 rounded-lg border-1 border-yellow-700 p-1 px-2 text-center text-sm font-semibold text-yellow-700 shadow-md"
                >
                  <TriangleAlert className="size-4" />
                  <span className="hidden md:inline-flex">
                    Account Pending Approval
                  </span>
                </Button>
              </UserUnlockDialog>
            )}
            {currentUser && !profileComplete && (
              <UserUnlockDialog>
                <Button
                  variant={"secondary"}
                  size={"sm"}
                  className="flex items-center justify-center border-1 border-yellow-600 bg-yellow-50 text-xs text-yellow-700 shadow-sm hover:bg-yellow-100"
                >
                  <OctagonAlert className="size-5" />
                  <span className="hidden md:inline-flex">
                    Incomplete Profile
                  </span>
                </Button>
              </UserUnlockDialog>
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
