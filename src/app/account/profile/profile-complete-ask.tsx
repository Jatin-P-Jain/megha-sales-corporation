"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronsRight } from "lucide-react";
import { useSafeRouter } from "@/hooks/useSafeRouter";

interface ProfileCompleteAskProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function ProfileCompleteAsk({
  open,
  setOpen,
}: ProfileCompleteAskProps) {
  const router = useSafeRouter();

  const handleLater = async () => {
    router.push("/");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-2 md:p-4">
        <DialogHeader className="p-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <DialogTitle className="text-lg md:text-xl">
              Profile Incomplete
            </DialogTitle>
          </div>

          <DialogDescription className="text-xs md:text-base">
            Please complete your profile information before requesting account
            approval. This helps us verify your details and speeds up the
            approval process.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm">
          <h4 className="text-sm font-semibold text-yellow-800">
            What&apos;s temporarily unavailable
          </h4>

          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• Viewing product discounts and special pricing</li>
            <li>• Adding items to the cart / building a cart</li>
            <li>• Placing orders (checkout)</li>
          </ul>

          <p className="text-xs text-yellow-700 italic">
            Please update your profile with all required information, then you
            can request approval to unlock full access.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => {
              setOpen(false);
            }}
            className="w-full"
          >
            Complete Profile Now <ChevronsRight className="size-4" />
          </Button>

          <Button onClick={handleLater} variant="outline" className="w-full">
            I will complete later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
