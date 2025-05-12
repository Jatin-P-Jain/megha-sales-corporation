"use client";
import React from "react";
import { Button } from "@/components/ui/button"; // Adjust the import path as needed
import { SendIcon } from "lucide-react";
import { useAuth } from "@/context/auth";
import { BrandStatus } from "@/types/brandStatus";
import { updateStatus } from "@/app/admin-dashboard/brands/action";
import { toast } from "sonner";

const PublishBrandButton = ({
  brandId,
  newStatus,
}: {
  brandId: string;
  newStatus: BrandStatus;
}) => {
  const auth = useAuth();

  const handlePublish = async () => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      return;
    }
    const updateResponse = await updateStatus(
      { brandId, newBrandStatus: newStatus },
      token
    );
    if (!!updateResponse?.error) {
      toast.error("Error", { description: updateResponse.message });
      return;
    }
    console.log("Brand published!");
  };

  return (
    <Button
      className="gap-2 w-full text-primary font-semibold"
      variant={"outline"}
      onClick={handlePublish}
    >
      <SendIcon />
      Publish Brand <span className="text-xs font-normal">to Add Products</span>
    </Button>
  );
};

export default PublishBrandButton;
