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
import { useAuth } from "@/context/useAuth";
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
import { deleteUserCart, deleteUserData } from "./actions";

export default function DeleteAccountButton({
  isPasswordProvider,
}: {
  isPasswordProvider?: boolean;
}) {
  const auth = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const deleteHandler = async () => {
    console.log({ isPasswordProvider });

    try {
      setIsDeleting(true);
      const user = auth?.currentUser;
      if (!user) {
        return;
      }
      if (isPasswordProvider) {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }
      await deleteUserCart({ userId: user.uid });
      await deleteUserData({ userId: user.uid });
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
        <Button variant={"destructive"} className="mt-4 cursor-pointer">
          <Trash2Icon />
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-slate-800">
              This action cannot be undone. This will permanently delete your
              account and all it's associated data.
              {!isPasswordProvider ? (
                <div className="text-red-700">
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
                : !isPasswordProvider
                  ? "Re-Authenticate & Delete Account"
                  : "Delete my account"
            }`}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
