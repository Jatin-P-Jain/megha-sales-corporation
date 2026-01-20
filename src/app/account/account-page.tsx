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
import { CopyIcon, Loader2Icon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AccountPage({
  isPasswordProvider,
  isAdmin,
}: {
  isPasswordProvider: boolean;
  isAdmin: boolean;
}) {
  // Hydration check for SSR/CSR sync
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const auth = useAuth();
  const { clientUser, clientUserLoading, setClientUser } = auth;

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
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
      // TODO: upload photo to backend/storage here

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

  // Show nothing until hydrated and user data is loaded
  if (!hasHydrated || clientUserLoading || !clientUser) return null;

  return (
    <div>
      <Card className="mx-auto w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle className="text-primary text-center text-2xl font-semibold">
            My Account
          </CardTitle>
          <div
            className={clsx("text-center text-sm", {
              "text-green-700": clientUser?.profileComplete,
              "text-red-700": !clientUser?.profileComplete,
            })}
          >
            {clientUser.profileComplete
              ? "✅ Your profile looks great and fully setup!🎉"
              : "🚫 Your profile is incomplete."}
          </div>
          {/* Editable Profile Photo */}
          <div className="relative flex flex-col items-center justify-center gap-2 py-4">
            {imageLoading && (
              <div>
                <Loader2Icon className="text-primary animate-spin" />
              </div>
            )}
            <Image
              src={photo}
              alt="Profile"
              className="ring-primary h-25 w-25 rounded-full border-4 border-white bg-white object-contain ring-2 md:h-30 md:w-30"
              width={100}
              height={100}
              onLoad={() => {
                setImageLoading(false);
              }}
            />
            {/* Show progress bar and percent while uploading */}
            {uploading ? (
              <div className="my-2 flex flex-col items-center">
                <Progress value={uploadPercent} className="w-32" />
                <span className="text-primary mt-2 text-sm font-medium">{`Uploading and updating your profile picture -  ${uploadPercent}%`}</span>
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
              Your Unique Identification Number (UID) in our system :
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
          </ul>
          {clientUser?.role === "admin" ? (
            <div className="rounded-md bg-green-100 p-2 px-4 text-center text-sm text-green-700">
              You are an <span className="font-semibold">Admin</span> - manage
              everything!
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-md p-2 text-sm">
              You have user access under role:
              <span className="text-primary text-lg font-semibold first-letter:uppercase">
                {clientUser.role}
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
