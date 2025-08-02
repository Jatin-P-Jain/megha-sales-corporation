import { z } from "zod";

export const productDataSchema = z
  .object({
    brandName: z.string().min(1, "Select a Brand Name"),
    companyName: z.string().min(1, "Select a Company Name"),
    vehicleCompany: z.string().min(1, "Select a Vehicle Company"),
    vehicleNames: z
      .array(z.string().min(2, "Vehicle Type must be at least 2 characters"))
      .min(1, "Select at least one Vehicle Type"),
    partCategory: z.string().min(1, "Select a Part Category"),
    partNumber: z.string().min(2, "Part Number must be at least 2 characters"),
    partName: z.string().min(2, "Part Name must be at least 2 characters"),

    price: z.coerce
      .number()
      .positive("Price must be greater than zero")
      .optional(),
    discount: z.coerce.number().min(0).max(100).optional(),
    gst: z.coerce.number().min(0).max(100).optional(),

    stock: z.coerce.number().optional(),
    status: z.enum(["draft", "for-sale", "discontinued", "out-of-stock"]),
    additionalDetails: z.string(),
    hasSizes: z.boolean().default(false),
    samePriceForAllSizes: z.boolean().default(true),
    sizes: z
      .array(
        z.object({
          size: z.string().min(1, "Size is required"),
          price: z.coerce.number().positive().optional(),
          discount: z.coerce.number().min(0).max(100).optional(),
          gst: z.coerce.number().min(0).max(100).optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const hasSizes = data.hasSizes ?? false;
    const samePrice = data.samePriceForAllSizes ?? true;

    if (!hasSizes || (hasSizes && samePrice)) {
      // Require global pricing
      if (
        data.price === undefined ||
        data.discount === undefined ||
        data.gst === undefined
      ) {
        ctx.addIssue({
          path: ["price"],
          message: "Provide global price, discount and GST",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    if (hasSizes && !samePrice) {
      if (!data.sizes || data.sizes.length === 0) {
        ctx.addIssue({
          path: ["sizes"],
          message: "Add at least one size with pricing",
          code: z.ZodIssueCode.custom,
        });
      } else {
        data.sizes.forEach((s, idx) => {
          if (!s.size?.trim()) {
            ctx.addIssue({
              path: ["sizes", idx, "size"],
              message: "Size is required",
              code: z.ZodIssueCode.custom,
            });
          }

          if (s.price === undefined) {
            ctx.addIssue({
              path: ["sizes", idx, "price"],
              message: "Price is required",
              code: z.ZodIssueCode.custom,
            });
          }

          if (s.discount === undefined) {
            ctx.addIssue({
              path: ["sizes", idx, "discount"],
              message: "Discount is required",
              code: z.ZodIssueCode.custom,
            });
          }

          if (s.gst === undefined) {
            ctx.addIssue({
              path: ["sizes", idx, "gst"],
              message: "GST is required",
              code: z.ZodIssueCode.custom,
            });
          }
        });
      }
    }

    // If hasSizes + samePrice: only validate size.label
    if (hasSizes && samePrice) {
      data.sizes.forEach((s, idx) => {
        if (!s.size?.trim()) {
          ctx.addIssue({
            path: ["sizes", idx, "size"],
            message: "Size is required",
            code: z.ZodIssueCode.custom,
          });
        }
        // Do NOT validate price/discount/gst here
      });
    }
  });

export const productImagesSchema = z.object({
  image: z
    .object({
      id: z.string(),
      url: z.string(),
      file:
        typeof window !== "undefined"
          ? z.instanceof(File).optional()
          : z.any().optional(),
    })
    .optional(),
});

export const productSchema = productDataSchema.and(productImagesSchema);
