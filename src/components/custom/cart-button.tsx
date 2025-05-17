"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { ArrowBigRightDashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CartButton() {
  const auth = useAuth();
  const router = useRouter();
  const handleCartClick = async () => {
    try {
      const tokenResult = await auth?.currentUser?.getIdTokenResult();
      if (!tokenResult) {
        router.push("/login");
        return;
      }
      router.push("account/cart");
    } catch (e) {
      console.log("e -- ", e);
      toast.error("Error!", { description: "An error occurred" });
    }
  };
  return (
    <Button className="w-full" onClick={handleCartClick}>
      Cart <ArrowBigRightDashIcon className="size-5" />
    </Button>
  );
}
