"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, ChangeEvent } from "react";
import UpdatePasswordForm from "./update-password";
import DeleteAccountButton from "./delete-account-button";
import Image from "next/image";
import { useAuth } from "@/context/useAuth";
import clsx from "clsx";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { storage } from "@/firebase/client";
import { toast } from "sonner";
import { updateUser } from "./actions";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { CopyIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountPage({
  isPasswordProvider,
}: {
  isPasswordProvider: boolean;
}) {
  // Hydration check for SSR/CSR sync
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const auth = useAuth();
  const { clientUser, clientUserLoading, setClientUser } = auth;
  const isAdmin = clientUser?.userType === "admin";
  const accountStatus = clientUser?.accountStatus;
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);

  // Set profile photo from clientUser when available
  const [photo, setPhoto] = useState<string>("");
  useEffect(() => {
    if (clientUser?.photoUrl) setPhoto(clientUser.photoUrl);
  }, [clientUser]);

  // Handle image file change
  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const uploadTasks: (UploadTask | Promise<void>)[] = [];
    let imagePath: string = "";

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setPhoto(e.target.result as string);
      };
      reader.readAsDataURL(file);

      console.log({ file });

      if (file) {
        imagePath = `users/${clientUser?.uid}/profile-picture/${Date.now()}-${file.name}`;
        const logoStorageRef = ref(storage, imagePath);
        const task = uploadBytesResumable(logoStorageRef, file);
        setUploading(true);
        setUploadPercent(0);
        task.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setUploadPercent(percent);
          },
          (error) => {
            console.error("Upload failed", error);
            toast.error("Upload failed for " + file!.name);
          },
        );

        uploadTasks.push(task.then(() => {}) as Promise<void>);
      }
    }
    console.log({ uploadTasks }, { imagePath }, { clientUser });

    await Promise.all(uploadTasks);
    await updateUser({ userId: clientUser?.uid ?? "", photoUrl: imagePath });
    setPhoto(imageUrlFormatter(imagePath));
    setClientUser((prev) =>
      prev ? { ...prev, photoUrl: imageUrlFormatter(imagePath) } : prev,
    );
    toast.success("Profile Updated!", {
      description: "New Profile Picture is set for your account.",
    });
    setUploading(false);
  };

  // Helper function to get account status display info
  const getAccountStatusInfo = () => {
    switch (accountStatus) {
      case "approved":
        return {
          icon: CheckCircle2,
          text: "Approved",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-300",
          title: "Account Approved!",
          description: "You have full access to all features.",
        };
      case "rejected":
        return {
          icon: XCircle,
          text: "Rejected",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-300",
          title: "Account Rejected.",
          description: "Please contact support for assistance.",
        };
      case "pending":
      default:
        return {
          icon: Clock,
          text: "Pending",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-300",
          title: "Pending Approval.",
          description:
            "Your account is under review. You'll be notified once approved.",
        };
    }
  };

  const statusInfo = getAccountStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Show nothing until hydrated and user data is loaded
  if (!hasHydrated || clientUserLoading || !clientUser) return null;

  return (
    <div>
      <Card className="mx-auto w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle className="text-primary text-center text-2xl font-semibold">
            My Account
          </CardTitle>

          {/* Account Approval Status */}
          {!isAdmin && (
            <div className="mt-2">
              <Alert
                className={clsx(statusInfo.bgColor, statusInfo.borderColor)}
              >
                <StatusIcon className={clsx("h-4 w-4", statusInfo.color)} />
                <AlertDescription
                  className={clsx("ml-2 text-sm", statusInfo.color)}
                >
                  <span className="font-semibold">{statusInfo.title}</span>
                  {statusInfo.description}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Editable Profile Photo */}
          <div className="relative flex flex-col items-center justify-center gap-2 py-4">
            <Avatar className="h-15 w-15 bg-white ring-1 md:h-25 md:w-25">
              {photo ? (
                <Image
                  src={photo}
                  alt="Profile"
                  className="ring-primary h-25 w-25 rounded-full border-4 border-white bg-white object-contain ring-2 md:h-30 md:w-30"
                  width={100}
                  height={100}
                />
              ) : (
                <AvatarFallback className="text-lg">
                  {(clientUser.displayName || clientUser.email)?.[0] || "U"}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Show progress bar and percent while uploading */}
            {uploading ? (
              <div className="my-2 flex flex-col items-center">
                <Progress value={uploadPercent} className="w-32" />
                <span className="text-primary mt-2 text-sm font-medium">{`Uploading and updating your profile picture - ${uploadPercent}%`}</span>
              </div>
            ) : (
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
                <span className="bg-muted text-primary hover:text-primary/90 cursor-pointer rounded-md px-3 py-1 text-xs">
                  Change Profile Picture
                </span>
              </label>
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-muted-foreground text-center text-xs">
              Your Unique Identification Number (UID) in our system:
            </span>
            <span className="text-primary flex items-center justify-center gap-2 text-sm font-semibold">
              {clientUser.uid}
              <CopyIcon
                className="text-primary size-4 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(clientUser.uid);
                  toast.success("UID copied to clipboard!");
                }}
              />
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <ul className="grid grid-cols-1 gap-3">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Name:</span>{" "}
              <span className="text-primary font-semibold">
                {clientUser.displayName}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Phone Number:
              </span>{" "}
              <span className="text-primary font-semibold">
                {clientUser.phone}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Email:</span>{" "}
              <span className="text-primary font-semibold">
                {clientUser.email}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">GST Number:</span>{" "}
              <span className="text-primary font-semibold">
                {clientUser.gstNumber ?? "-"}
              </span>
            </li>
            {!isAdmin && (
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Account Status:
                </span>{" "}
                <span
                  className={clsx(
                    "flex items-center gap-1 font-semibold capitalize",
                    statusInfo.color,
                  )}
                >
                  <StatusIcon className="h-4 w-4" />
                  {statusInfo.text}
                </span>
              </li>
            )}
          </ul>

          {clientUser?.userType === "admin" ? (
            <div className="rounded-md bg-green-100 p-2 px-4 text-center text-sm text-green-700">
              You are an <span className="font-semibold">Admin</span> - manage
              everything!
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-md p-2 text-sm">
              You have user access under role:
              <span className="text-primary text-lg font-semibold first-letter:uppercase">
                {clientUser.userType}
              </span>
            </div>
          )}
        </CardContent>

        {isPasswordProvider && (
          <>
            <Separator />
            <CardContent>
              <div className="text-md mb-5 font-semibold text-cyan-950">
                Update Your Password
              </div>
              <UpdatePasswordForm />
            </CardContent>
          </>
        )}

        {!isAdmin && (
          <>
            <Separator />
            <CardFooter className="flex flex-col gap-1">
              <div className="flex w-full text-xl font-bold text-red-600">
                Delete Account
              </div>
              <span className="flex w-full text-sm text-zinc-700 italic">
                You will be deleting your account permanently. Are you sure?
              </span>
              <DeleteAccountButton
                isPasswordProvider={isPasswordProvider ? true : false}
              />
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
