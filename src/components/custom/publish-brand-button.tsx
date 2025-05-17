"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Adjust the import path as needed
import { Loader2, SendIcon } from "lucide-react";
import { useAuth } from "@/context/useAuth";
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
  const [isPublishing, setIsPublishing] = useState(false);
  const handlePublish = async () => {
    setIsPublishing(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsPublishing(false);
      return;
    }
    const updateResponse = await updateStatus(
      { brandId, newBrandStatus: newStatus },
      token,
    );
    if (!!updateResponse?.error) {
      toast.error("Error", { description: updateResponse.message });
      setIsPublishing(false);
      return;
    }
    setIsPublishing(false);
    toast.success("Success", { description: "Brand published successfully" });
  };

  return (
    <Button
      className="text-primary w-full gap-2 font-semibold"
      variant={"outline"}
      onClick={handlePublish}
    >
      {isPublishing ? (
        <>
          <Loader2 className="animate-spin" />
          Publishing Brand
        </>
      ) : (
        <>
          <SendIcon />
          Publish Brand{" "}
          <span className="text-xs font-normal">to Add Products</span>
        </>
      )}
    </Button>
  );
};

export default PublishBrandButton;
