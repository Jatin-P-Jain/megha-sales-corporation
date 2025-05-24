"use client";

import { Button } from "@/components/ui/button";
import { ArrowBigRightDashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function CartButton() {
  const router = useRouter();

  // when confirmed, we really navigate
  const checkOutHandler = () => {
    router.push("/account/cart/checkout");
  };

  return (
    <Dialog>
      {/* use the existing button as the trigger */}
      <DialogTrigger asChild>
        <Button className="flex w-full items-center justify-center">
          <span>Cart</span>
          <ArrowBigRightDashIcon className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cart</DialogTitle>
          <DialogDescription>Yout Items</DialogDescription>
        </DialogHeader>
        <span className="text-primary flex items-center justify-center font-bold">
          (WORK IN PROGRESS)
        </span>

        <DialogFooter className="flex flex-row space-x-2 justify-between">
          {/* Always offer a Cancel */}
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={checkOutHandler}>Proceed to Checkout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
