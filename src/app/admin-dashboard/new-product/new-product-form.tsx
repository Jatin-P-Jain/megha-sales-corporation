"use client";

import ProductForm from "@/components/custom/product-form";
import { productSchema } from "@/validation/productSchema";

import { z } from "zod";
import { Loader2, PlusCircleIcon } from "lucide-react";
import { useAuth } from "@/context/useAuth";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { storage } from "@/firebase/client";
import { createProduct } from "./actions";
import { saveProductMedia, updateBrandProcuctCount } from "../actions";
import { Brand } from "@/types/brand";
import { useEffect, useState } from "react";

export default function NewProductForm({ brand }: { brand?: Brand | Brand[] }) {
  const auth = useAuth();
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [brandSelected, setBrandSelected] = useState<Brand | undefined>(
    undefined,
  );
  useEffect(() => {
    if (!Array.isArray(brand)) {
      setBrandSelected(brand);
    }
  }, [brand]);

  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true);
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const { image, ...rest } = data;
    const saveResponse = await createProduct(
      { brandId: brandSelected?.id ?? "", ...rest },
      token,
    );
    if (!!saveResponse.error || !saveResponse.productId) {
      toast.error("Error!", { description: saveResponse.error });
      setIsLoading(false);
      return;
    }
    await updateBrandProcuctCount(
      {
        brandId: brandSelected?.id ?? "",
        totalProducts: (brandSelected?.totalProducts ?? 0) + 1,
      },
      token,
    );
    const uploadTasks: (UploadTask | Promise<void>)[] = [];

    let imagePath: string = "";
    if (image?.file) {
      imagePath = `products/${brandSelected?.id}/${saveResponse.productId}/${Date.now()}-${
        image?.file.name
      }`;
      const logoStorageRef = ref(storage, imagePath);
      const task = uploadBytesResumable(logoStorageRef, image.file);
      task.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          setProgressMap((prev) => ({
            ...prev,
            [`${image.file.name}`]: percent,
          }));
        },
        (error) => {
          console.error("Upload failed", error);
          toast.error("Upload failed for " + image.file!.name);
        },
      );

      uploadTasks.push(task.then(() => {}) as Promise<void>);
    }

    await Promise.all(uploadTasks);
    await saveProductMedia(
      { productId: saveResponse.productId, image: imagePath },
      token,
    );
    setIsLoading(false);
    toast.success("Success", { description: "Product Created" });
    router.back();
  };
  return (
    <div>
      <ProductForm
        progressMap={progressMap}
        brand={brandSelected}
        allBrands={Array.isArray(brand) ? brand : []}
        handleSelectBrand={(brand) => {
          setBrandSelected(brand);
        }}
        handleSubmit={handleSubmit}
        submitButtonLabel={
          isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Adding Product
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-center">
                <PlusCircleIcon />
                Add Product
              </div>
            </>
          )
        }
      />
    </div>
  );
}
