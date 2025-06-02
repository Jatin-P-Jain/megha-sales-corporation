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
import { Brand } from "@/types/brand";
import { useState } from "react";
import { slugify } from "@/lib/utils";
import { saveProductMedia } from "@/app/admin-dashboard/actions";
import { Product } from "@/types/product";
import ProductForm from "@/components/custom/product-form";
import { productSchema } from "@/validation/productSchema";
import { updateProduct } from "./actions";

export default function EditProductForm({
  product,
  brand,
}: {
  product: Product;
  brand: Brand;
}) {
  const {
    id,
    brandId,
    brandName,
    companyName,
    vehicleCompany,
    vehicleName,
    partCategory,
    partName,
    partNumber,
    price,
    discount,
    gst,
    status,
    stock,
    image,
  } = product;
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const { image: newImage, ...rest } = data;

    const updateResponse = await updateProduct(
      { ...rest, id, brandId, image },
      token,
    );
    if (!!updateResponse?.error) {
      toast.error("Error", { description: updateResponse.message });
      setIsLoading(false);
      return;
    }
    const storageTasks: (UploadTask | Promise<void>)[] = [];

    let logoPath = image; // default to whatever was there
    if (newImage) {
      const isSameUrl = !newImage.file && newImage.url === image;

      if (!isSameUrl) {
        if (image) {
          storageTasks.push(deleteObject(ref(storage, image)));
        }

        if (newImage.file) {
          const filename = `${Date.now()}-u-${newImage.file.name}`;
          const path = `products/${slugify(brandName)}/${filename}`;
          logoPath = path; // store the raw storage path
          const storageRef = ref(storage, path);
          const task = uploadBytesResumable(storageRef, newImage.file);
          task.on(
            "state_changed",
            (snapshot) => {
              const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              );
              setProgressMap((prev) => ({
                ...prev,
                [`${newImage.file.name}`]: percent,
              }));
            },
            (error) => {
              console.error("Upload failed", error);
              toast.error("Upload failed for " + newImage.file!.name);
            },
          );

          storageTasks.push(task.then(() => {}) as Promise<void>);
        } else {
          logoPath = newImage.url;
        }
      }
    }

    await Promise.all(storageTasks);
    await saveProductMedia({ productId: id, image: logoPath ?? "" }, token);
    setIsLoading(false);
    toast.success("Success!", { description: "Product Updated" });
    router.push("/products-list");
  };
  return (
    <div className="relative">
      <ProductForm
        brand={brand}
        progressMap={progressMap}
        handleSubmit={handleSubmit}
        submitButtonLabel={
          isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Saving Product
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-center">
                <SaveIcon />
                Save Product
              </div>
            </>
          )
        }
        defaultValues={{
          brandName,
          companyName,
          vehicleCompany,
          vehicleName,
          partCategory,
          partName,
          partNumber,
          price,
          discount,
          gst,
          status,
          stock,
          image: { id: image ?? "", url: image ?? "" },
        }}
      />
    </div>
  );
}
