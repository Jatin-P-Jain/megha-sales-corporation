"use client";

import { z } from "zod";
import { Loader2, PlusCircleIcon } from "lucide-react";
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
import { useState } from "react";
import { slugify } from "@/lib/utils";

export default function NewBrandForm() {
  const auth = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const handleSubmit = async (data: z.infer<typeof brandSchema>) => {
    setIsLoading(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const { brandMedia, brandLogo, ...rest } = data;
    const saveResponse = await createBrand(rest, token);
    if (!!saveResponse.error || !saveResponse.brandId) {
      toast.error("Error!", { description: saveResponse.error });
      setIsLoading(false);
      return;
    }
    const uploadTasks: (UploadTask | Promise<void>)[] = [];
    const media: BrandMedia[] = [];
    let logoPath: string = "";
    brandMedia.forEach((item, index) => {
      if (item.file) {
        const path = `brands/${slugify(
          saveResponse.brandName
        )}/brandsMedia/${Date.now()}-${index}-${item.file.name}`;
        media.push({ fileName: item.file.name, fileUrl: path });
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, item.file);
        task.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgressMap((prev) => ({
              ...prev,
              [`${item.file.name}`]: percent,
            }));
          },
          (error) => {
            console.error("Upload failed", error);
            toast.error("Upload failed for " + item.file!.name);
          }
        );

        uploadTasks.push(task.then(() => {}) as Promise<void>);
      }
    });
    if (brandLogo.file) {
      logoPath = `brands/${slugify(
        saveResponse.brandName
      )}/brandLogo/${Date.now()}-${brandLogo.file.name}`;
      const logoStorageRef = ref(storage, logoPath);
      uploadTasks.push(uploadBytesResumable(logoStorageRef, brandLogo.file));
    }
    await Promise.all(uploadTasks);
    await saveBrandMedia(
      { brandId: saveResponse.brandId, brandMedia: media, brandLogo: logoPath },
      token
    );
    setIsLoading(false);
    toast.success("Success", { description: "Brand Created" });
    router.push("/admin-dashboard");
  };
  return (
    <BrandForm
      progressMap={progressMap}
      handleSubmit={handleSubmit}
      submitButtonLabel={
        isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            Adding Brand
          </>
        ) : (
          <>
            <PlusCircleIcon />
            Add Brand
          </>
        )
      }
    />
  );
}
