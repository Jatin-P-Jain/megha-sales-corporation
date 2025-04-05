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
            You must login to favourite a property
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
