"use client";

import { z } from "zod";
import { PlusCircleIcon } from "lucide-react";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { storage } from "@/firebase/client";
import BrandForm from "@/components/custom/brand-form";
import { brandSchema } from "@/validation/brandSchema";
import { createBrand } from "./actions";
import { saveBrandMedia } from "../actions";
import { BrandMedia } from "@/types/brand";

export default function NewBrandForm() {
  const auth = useAuth();
  const router = useRouter();
  const handleSubmit = async (data: z.infer<typeof brandSchema>) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      return;
    }
    const { brandMedia, brandLogo, ...rest } = data;
    const saveResponse = await createBrand(rest, token);
    if (!!saveResponse.error || !saveResponse.brandId) {
      toast.error("Error!", { description: saveResponse.error });
      return;
    }
    const uploadTasks: UploadTask[] = [];
    const media: BrandMedia[] = [];
    let logoPath: string = "";
    brandMedia.forEach((item, index) => {
      if (item.file) {
        const path = `brands/brandMedia/${
          saveResponse.brandName
        }/${Date.now()}-${index}-${item.file.name}`;

        media.push({ fileName: item.file.name, fileUrl: path });
        const storageRef = ref(storage, path);
        uploadTasks.push(uploadBytesResumable(storageRef, item.file));
      }
    });
    if (brandLogo.file) {
      logoPath = `brandLogos/${saveResponse.brandName}/${Date.now()}-${
        brandLogo.file.name
      }`;
      const logoStorageRef = ref(storage, logoPath);
      uploadTasks.push(uploadBytesResumable(logoStorageRef, brandLogo.file));
    }
    await Promise.all(uploadTasks);
    await saveBrandMedia(
      { brandId: saveResponse.brandId, brandMedia: media, brandLogo: logoPath },
      token
    );
    toast.success("Success", { description: "Brand Created" });
    router.push("/admin-dashboard");
  };
  return (
    <div>
      <BrandForm
        handleSubmit={handleSubmit}
        submitButtonLabel={
          <>
            <PlusCircleIcon />
            Add Brand
          </>
        }
      />
    </div>
  );
}
