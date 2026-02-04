import { z } from "zod";

export const userProfileDataSchema = z
  .object({
    userType: z
      .enum(["admin", "customer", "accountant", "dispatcher", "other"])
      .or(z.string()),
    email: z.string().email(),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    businessIdType: z.enum(["pan", "gst"]),
    panNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, { message: "Invalid mobile number" }),
    photoUrl: z.string().optional(),
    businessType: z
      .enum(["retailer", "wholesaler", "distributor", "other"])
      .or(z.string())
      .optional(),
    otherBusinessType: z
      .string()
      .min(2, "You should specify your business type.")
      .optional(),
  })
  .refine((data) => data.businessType !== "other" || !!data.otherBusinessType, {
    message: "You must specify your business type.",
    path: ["otherBusinessType"],
  })
  // ✅ Add validation: if businessIdType is 'pan', panNumber must be valid
  .refine(
    (data) => {
      if (data.businessIdType === "pan") {
        return data.panNumber && /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(data.panNumber);
      }
      return true;
    },
    {
      message: "Invalid PAN format (must be 10 characters)",
      path: ["panNumber"],
    },
  )
  // ✅ Add validation: if businessIdType is 'gst', gstNumber must be valid
  .refine(
    (data) => {
      if (data.businessIdType === "gst") {
        return (
          data.gstNumber &&
          /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(
            data.gstNumber,
          )
        );
      }
      return true;
    },
    {
      message: "Invalid GSTIN format (must be 15 characters)",
      path: ["gstNumber"],
    },
  );

export const mobileOtpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, { message: "Invalid OTP" })
    .optional(),
});

export const userProfileSchema = userProfileDataSchema.and(mobileOtpSchema);
