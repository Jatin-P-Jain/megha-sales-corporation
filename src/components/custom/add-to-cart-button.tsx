"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, PlusSquareIcon } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AddToCartButton: React.FC = () => {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleAddToCartClick = async () => {
    setLoading(true);
    try {
      const tokenResult = await auth?.currentUser?.getIdTokenResult();
      if (!tokenResult) {
        router.push("/login");
        setLoading(false);
        return;
      }
      router.refresh();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.log("e -- ", e);
      toast.error("Error!", { description: "An error occurred" });
    }
  };
  return (
    <Button className="w-full md:w-3/4" onClick={handleAddToCartClick}>
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Adding to Cart
        </>
      ) : (
        <>
          <PlusSquareIcon className="size-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
