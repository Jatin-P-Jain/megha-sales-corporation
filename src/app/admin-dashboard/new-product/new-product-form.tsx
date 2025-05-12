"use client";

import ProductForm from "@/components/custom/product-form";
import { productSchema } from "@/validation/productSchema";

import { z } from "zod";
import { PlusCircleIcon } from "lucide-react";
import { useAuth } from "@/context/auth";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { storage } from "@/firebase/client";
import { createProduct } from "./actions";
import { saveProductMedia, updateBrandProcuctCount } from "../actions";
import { Brand } from "@/types/brand";

export default function NewProductForm({ brand }: { brand: Brand }) {
  const auth = useAuth();
  const router = useRouter();
  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      return;
    }
    const { images, ...rest } = data;
    const saveResponse = await createProduct(rest, token);
    if (!!saveResponse.error || !saveResponse.productId) {
      toast.error("Error!", { description: saveResponse.error });
      return;
    }
    await updateBrandProcuctCount(
      { brandId: brand.id, totalProducts: brand.totalProducts + 1 },
      token
    );
    const uploadTasks: UploadTask[] = [];
    const paths: string[] = [];
    images.forEach((image, index) => {
      if (image.file) {
        const path = `products/${
          saveResponse.productId
        }/${Date.now()}-${index}-${image.file.name}`;
        paths.push(path);
        const storageRef = ref(storage, path);
        uploadTasks.push(uploadBytesResumable(storageRef, image.file));
      }
    });
    await Promise.all(uploadTasks);
    await saveProductMedia(
      { productId: saveResponse.productId, media: paths },
      token
    );
    toast.success("Success", { description: "Property Created" });
    router.push("/admin-dashboard");
  };
  return (
    <div>
      <ProductForm
        brand={brand}
        handleSubmit={handleSubmit}
        submitButtonLabel={
          <>
            <PlusCircleIcon />
            Add Product
          </>
        }
      />
    </div>
  );
}
