import { z } from "zod";

export const propertyDataSchema = z.object({
  address1: z.string().min(1, "Address Line 1 must contain a value"),
  address2: z.string().optional(),
  city: z.string().min(3, "City must contain at least 3 characters"),
  postalCode: z.string().refine((postalCode) => {
    const postalCodeRegex = /^\d{6}$/;
    return postalCodeRegex.test(postalCode);
  }, "Postal Code must be 6 digit"),
  price: z.coerce.number().positive("Price must be greater than zero."),
  description: z
    .string()
    .min(40, "Description must contain at least 40 characters"),
  bedrooms: z.coerce.number().min(0, "Number of bedrooms must be at least 0."),
  bathrooms: z.coerce
    .number()
    .min(0, "Number of bathrooms must be at least 0."),
  status: z.enum(["draft", "for-sale", "withdrawn", "sold"]),
});

export const propertyImagesSchema = z.object({
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

export const propertySchema = propertyDataSchema.and(propertyImagesSchema);
