"use client";

import PropertyForm from "@/components/custom/property-form";
import { auth, storage } from "@/firebase/client";
import { Property } from "@/types/property";
import { propertySchema } from "@/validation/propertySchema";
import { SaveIcon, Upload } from "lucide-react";
import { z } from "zod";
import { updateProperty } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  deleteObject,
  ref,
  uploadBytesResumable,
  UploadTask,
} from "firebase/storage";
import { savePropertyImages } from "../../actions";

type Props = Property;
export default function EditPropertyForm({
  id,
  address1,
  address2,
  bathrooms,
  bedrooms,
  city,
  description,
  postalCode,
  price,
  status,
  images = [],
}: Props) {
  const router = useRouter();
  const handleSubmit = async (data: z.infer<typeof propertySchema>) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      return;
    }
    const { images: newImages, ...rest } = data;
    const updateResponse = await updateProperty({ ...rest, id }, token);
    if (!!updateResponse?.error) {
      toast.error("Error"), { description: updateResponse.message };
      return;
    }
    const storageTasks: (UploadTask | Promise<void>)[] = [];
    const imagesToDelete = images.filter(
      (image) => !newImages.find((newImage) => image === newImage.url)
    );
    imagesToDelete.forEach((image) => {
      storageTasks.push(deleteObject(ref(storage, image)));
    });
    const paths: string[] = [];
    newImages.forEach((image, index) => {
      if (image.file) {
        const path = `properties/${id}/${Date.now()}-${index}-${
          image.file.name
        }`;
        paths.push(path);
        const storageRef = ref(storage, path);
        storageTasks.push(uploadBytesResumable(storageRef, image.file));
      } else {
        paths.push(image.url);
      }
    });
    await Promise.all(storageTasks);
    await savePropertyImages({ images: paths, propertyId: id }, token);
    toast.success("Success!", { description: "Property Updated" });
    router.push("/admin-dashboard");
  };
  return (
    <PropertyForm
      handleSubmit={handleSubmit}
      submitButtonLabel={
        <>
          <div className="flex items-center text-center gap-2">
            <SaveIcon />
            Save Property
          </div>
        </>
      }
      defaultValues={{
        address1,
        address2,
        bathrooms,
        bedrooms,
        city,
        description,
        postalCode,
        price,
        status,
        images: images.map((image) => {
          return { id: image, url: image };
        }),
      }}
    />
  );
}
