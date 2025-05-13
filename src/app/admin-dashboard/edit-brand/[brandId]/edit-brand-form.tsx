"use client";
import { auth, storage } from "@/firebase/client";
import { Loader2, SaveIcon } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  deleteObject,
  ref,
  uploadBytesResumable,
  UploadTask,
} from "firebase/storage";
import BrandForm from "@/components/custom/brand-form";
import { Brand, BrandMedia } from "@/types/brand";
import { brandSchema } from "@/validation/brandSchema";
import { updateBrand } from "./actions";
import { saveBrandMedia } from "../../actions";
import { useState } from "react";
import { slugify } from "@/lib/utils";

type Props = Brand;
export default function EditBrandForm({
  id,
  brandName,
  brandLogo,
  companies,
  vehicleCompanies,
  vehicleNames,
  partCategories,
  totalProducts,
  description,
  status,
  brandMedia,
}: Props) {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleSubmit = async (data: z.infer<typeof brandSchema>) => {
    setIsLoading(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const {
      brandLogo: newBrandLogo,
      brandMedia: newBrandMedia,
      ...rest
    } = data;
    const updateResponse = await updateBrand(
      { ...rest, id, brandLogo, brandMedia, totalProducts },
      token
    );
    if (!!updateResponse?.error) {
      toast.error("Error", { description: updateResponse.message });
      setIsLoading(false);
      return;
    }
    const storageTasks: (UploadTask | Promise<void>)[] = [];
    const mediaToDelete = brandMedia.filter(
      (media) =>
        !newBrandMedia.find((newMedia) => media.fileUrl === newMedia.url)
    );
    mediaToDelete.forEach((image) => {
      storageTasks.push(deleteObject(ref(storage, image.fileUrl)));
    });
    const media: BrandMedia[] = [];

    newBrandMedia.forEach((brandMedia, index) => {
      if (brandMedia.file) {
        const path = `brands/${slugify(
          brandName
        )}/brandsMedia/${Date.now()}-${index}-u-${brandMedia.file.name}`;
        media.push({ fileName: brandMedia.file.name, fileUrl: path });
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, brandMedia.file);
        task.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgressMap((prev) => ({
              ...prev,
              [`${brandMedia.file.name}`]: percent,
            }));
          },
          (error) => {
            console.error("Upload failed", error);
            toast.error("Upload failed for " + brandMedia.file!.name);
          }
        );

        storageTasks.push(task.then(() => {}) as Promise<void>);
      } else {
        media.push({
          fileName: brandMedia.fileName || "",
          fileUrl: brandMedia.url,
        });
      }
    });

    let logoPath = brandLogo; // default to whatever was there
    if (newBrandLogo) {
      const isSameUrl = !newBrandLogo.file && newBrandLogo.url === brandLogo;

      if (!isSameUrl) {
        if (brandLogo) {
          storageTasks.push(deleteObject(ref(storage, brandLogo)));
        }

        if (newBrandLogo.file) {
          const filename = `${Date.now()}-u-${newBrandLogo.file.name}`;
          const path = `brands/${slugify(brandName)}/brandLogo/${filename}`;
          logoPath = path; // store the raw storage path
          const storageRef = ref(storage, path);
          storageTasks.push(
            uploadBytesResumable(storageRef, newBrandLogo.file)
          );
        } else {
          logoPath = newBrandLogo.url;
        }
      }
    }

    await Promise.all(storageTasks);
    await saveBrandMedia(
      { brandMedia: media, brandId: id, brandLogo: logoPath },
      token
    );
    setIsLoading(false);
    toast.success("Success!", { description: "Brand Updated" });
    router.push("/admin-dashboard");
  };
  return (
    <div className="relative">
      <BrandForm
        progressMap={progressMap}
        handleSubmit={handleSubmit}
        submitButtonLabel={
          isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Saving Brand
            </>
          ) : (
            <>
              <div className="flex items-center text-center gap-2">
                <SaveIcon />
                Save Brand
              </div>
            </>
          )
        }
        defaultValues={{
          brandName,
          brandLogo: { id: brandLogo, url: brandLogo },
          companies,
          vehicleCompanies,
          vehicleNames,
          partCategories,
          description,
          status,
          brandMedia: brandMedia.map((media) => {
            return {
              id: media?.fileUrl,
              url: media?.fileUrl,
              fileName: media?.fileName,
            };
          }),
        }}
      />
    </div>
  );
}
