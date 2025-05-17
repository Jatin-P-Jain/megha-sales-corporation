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
import { useRouter } from "next/navigation";
import { deleteProduct } from "./actions";
import { updateBrandProcuctCount } from "@/app/admin-dashboard/actions";
import { useAuth } from "@/context/useAuth";

export default function DeleteProductButton({
  brandId,
  totalBrandProducts,
  productId,
}: {
  brandId: string;
  totalBrandProducts: number;
  productId: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const auth = useAuth();

  const deleteHandler = async () => {
    setIsDeleting(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsDeleting(false);
      return;
    }
    try {
      const deleteResponse = await deleteProduct(productId);
      if (!deleteResponse?.error) {
        const updateCountResponse = await updateBrandProcuctCount(
          {
            brandId,
            totalProducts: totalBrandProducts > 0 ? totalBrandProducts - 1 : 0,
          },
          token,
        );
        if (!updateCountResponse?.error) {
          toast.success("Product deleted successfully");
          router.push("/products-list");
        }
      }
    } catch (e: unknown) {
      console.log(e);

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
              product and all its associated data.
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
            className="bg-red-700 hover:bg-red-800 hover:shadow-md"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" />
                Deleting Product
              </>
            ) : (
              <>
                <Trash2Icon />
                Delete Product
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
