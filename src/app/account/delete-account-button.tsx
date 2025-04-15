"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth";
import { Label } from "@radix-ui/react-dropdown-menu";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import deleteUserFavourites from "./actions";

export default function DeleteAccountButton({
  isGoogleProvider,
}: {
  isGoogleProvider?: boolean;
}) {
  const auth = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const deleteHandler = async () => {
    console.log({ isGoogleProvider });

    try {
      setIsDeleting(true);
      const user = auth?.currentUser;
      if (!user) {
        return;
      }
      if (!isGoogleProvider) {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }

      await deleteUserFavourites();
      await deleteUser(user);
      toast.success("Account deleted successfully");
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "auth/invalid-credential") {
        toast.error("Invalid credentials", {
          description: "Please check your password and try again.",
        });
      } else {
        toast.error("Error!", {
          description: "An error occurred.",
        });
      }
    }
    setPassword("");
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={"destructive"} className="cursor-pointer mt-4">
          <Trash2Icon />
          Delete my account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-slate-800">
              This action cannot be undone. This will permanently delete your
              account and all associated data.
              {isGoogleProvider ? (
                <div className="text-red-800">
                  <Label className="mt-4 mb-1">Important :</Label>
                  <Label>
                    For security reasons, you must{" "}
                    <span className="font-bold">re-authenticate</span> with your
                    Google account before we can delete your profile.
                  </Label>
                </div>
              ) : (
                <>
                  <Label className="mt-4 mb-1">
                    Enter your password to confirm:
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant={"outline"}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={"destructive"} onClick={deleteHandler}>{`${
              isDeleting
                ? "Deleting..."
                : isGoogleProvider
                ? "Sign In and Delete Account"
                : "Delete my account"
            }`}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
