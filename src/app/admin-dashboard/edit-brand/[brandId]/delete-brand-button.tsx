"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteBrand } from "./actions";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const deleteHandler = async () => {
    try {
      setIsDeleting(true);
      const deleteResponse = await deleteBrand(brandId);
      if (!deleteResponse?.error) {
        toast.success("Brand deleted successfully");
        router.push("/admin-dashboard");
      }
    } catch (_e: unknown) {
      toast.error("Error!", {
        description: "An error occurred.",
      });
    }
    setIsDeleting(false);
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={"destructive"} className="cursor-pointer bg-red-700">
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-slate-800">
              This action cannot be undone. This will permanently delete the
              brand and all its associated data.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant={"outline"}>Cancel</Button>
          </AlertDialogCancel>
          <Button
            variant={"destructive"}
            onClick={deleteHandler}
            className="bg-red-700 hover:shadow-md hover:bg-red-800"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" />
                Deleting Brand
              </>
            ) : (
              <>
                <Trash2Icon />
                Delete Brand
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
