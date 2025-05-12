import { z } from "zod";

export const brandDataSchema = z.object({
  brandName: z.string().min(2, "Brand Name must be at least 2 characters"),
  companies: z
    .array(z.string().min(2, "Company Name must be at least 2 characters"))
    .min(1, "At least 1 company is required"),
  vehicleCompanies: z
    .array(z.string().min(2, "Vehicle Company must be at least 2 characters"))
    .min(1, "At least 1 vehicle company is required"),
  vehicleNames: z
    .array(z.string().min(2, "Vehicle Type must be at least 2 characters")).optional(),
  partCategories: z
    .array(z.string().min(2, "Part Category must be at least 2 characters"))
    .min(1, "At least 1 part category is required"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  status: z.enum(["draft", "live", "discontinued"]),
});

export const brandLogoSchema = z.object({
  brandLogo: z.object({
    id: z.string(),
    url: z.string(),
    file:
      typeof window !== "undefined"
        ? z.instanceof(File).optional()
        : z.any().optional(),
  }),
});
export const brandMediaSchema = z.object({
  brandMedia: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      fileName: z.string().optional(),
      file:
        typeof window !== "undefined"
          ? z.instanceof(File).optional()
          : z.any().optional(),
    })
  ),
});

export const brandSchema = brandDataSchema
  .and(brandLogoSchema)
  .and(brandMediaSchema);
