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
import { deleteProduct, updateProduct } from "./actions";
import { createProduct } from "@/app/admin-dashboard/new-product/actions";

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
    vehicleNames,
    partCategory,
    partName,
    partNumber,
    price,
    discount,
    gst,
    status,
    stock,
    hasSizes,
    samePriceForAllSizes,
    sizes,
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

    // const updateResponse = await updateProduct(
    //   { ...rest, id, brandId, image },
    //   token,
    // );
    // if (!!updateResponse?.error) {
    //   toast.error("Error", { description: updateResponse.message });
    //   setIsLoading(false);
    //   return;
    // }
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

    const partNumberChanged = data?.partNumber !== partNumber;
    if (partNumberChanged) {
      // 🔥 Delete existing product
      const deleteRes = await deleteProduct(id);
      if (deleteRes?.error) {
        toast.error("Failed to delete old product");
        setIsLoading(false);
        return;
      }

      // 🆕 Create new product
      const createRes = await createProduct(
        {
          ...rest,
          partNumber: data?.partNumber,
        },
        token,
      );

      if (createRes?.error) {
        toast.error("Failed to create product", {
          description: createRes.message,
        });
        setIsLoading(false);
        return;
      }
      await Promise.all(storageTasks);
      await saveProductMedia(
        {
          productId: createRes.productId ?? "",
          image: logoPath ?? "",
        },
        token,
      );
      setIsLoading(false);
      toast.success("Success!", { description: "Product Updated" });
      router.push("/products-list");
    } else {
      // ✅ Just update normally
      const updateResponse = await updateProduct(
        { ...rest, id, brandId, image },
        token,
      );
      if (updateResponse?.error) {
        toast.error("Update failed", { description: updateResponse.message });
        setIsLoading(false);
        return;
      }
      await Promise.all(storageTasks);
      await saveProductMedia(
        {
          productId: id,
          image: logoPath ?? "",
        },
        token,
      );
      setIsLoading(false);
      toast.success("Success!", { description: "Product Updated" });
      router.push("/products-list");
    }
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
          vehicleNames,
          partCategory,
          partName,
          partNumber,
          price,
          discount,
          gst,
          status,
          stock,
          hasSizes: hasSizes ?? false,
          samePriceForAllSizes: samePriceForAllSizes ?? true,
          sizes: sizes ?? [],
          image: { id: image ?? "", url: image ?? "" },
        }}
      />
    </div>
  );
}
