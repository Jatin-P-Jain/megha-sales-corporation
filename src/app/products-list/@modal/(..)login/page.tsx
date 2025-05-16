"use client";
import LoginForm from "@/components/custom/login-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import loginModalSuccess from "./actions";

export default function LoginModal() {
  const router = useRouter();
  return (
    <Dialog
      open
      onOpenChange={() => {
        router.back();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="">Login</DialogTitle>
          <DialogDescription className="">
            Please log in to view your cart or add items.
          </DialogDescription>
        </DialogHeader>
        <LoginForm
          onSuccess={async () => {
            await loginModalSuccess();
            router.back();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
