import { z } from "zod";

export const productDataSchema = z.object({
  brandName: z.string().min(1, "Select a Brand Name"),
  companyName: z.string().min(1, "Select a Company Name"),
  vehicleCompany: z.string().min(1, "Select a Vehicle Company"),
  vehicleName: z.string().min(1, "Select a Vehicle Name"),
  partCategory: z.string().min(1, "Select a Part Category"),
  partNumber: z.string().min(2, "Part Number must be at least 2 characters"),
  partName: z.string().min(2, "Part Name must be at least 2 characters"),
  price: z.coerce.number().positive("Price must be greater than zero"),
  discount: z.coerce
    .number()
    .min(0, "Discount must be at least 0%")
    .max(100, "Discount cannot exceed 100%"),
  gst: z.coerce
    .number()
    .min(0, "GST must be at least 0%")
    .max(100, "GST cannot exceed 100%"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  status: z.enum(["draft", "for-sale", "discontinued", "out-of-stock"]),
});

export const productImagesSchema = z.object({
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      file:
        typeof window !== "undefined"
          ? z.instanceof(File).optional()
          : z.any().optional(),
    })
  ),
});

export const productSchema = productDataSchema.and(productImagesSchema);
