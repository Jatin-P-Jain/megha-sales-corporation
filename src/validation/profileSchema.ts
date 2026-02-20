import { z } from "zod";

export const userProfileDataSchema = z
  .object({
    userType: z
      .enum(["admin", "customer", "accountant", "dispatcher", "other"])
      .or(z.string())
      .optional(),
    email: z.string().email(),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    businessIdType: z.enum(["pan", "gst"]).optional(),
    panNumber: z.string().optional(), // ✅ Kept optional
    gstNumber: z.string().optional(), // ✅ Kept optional
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
      .min(2, "You must specify your business type.")
      .optional(),
  })
  .refine((data) => data.businessType !== "other" || !!data.otherBusinessType, {
    message: "You must specify your business type.",
    path: ["otherBusinessType"],
  })
  // ✅ NEW: Self-validation for PAN - only triggers after exactly 10 chars
  .refine(
    (data) => {
      const pan = data.panNumber;
      return !pan || pan.length !== 10 || /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan);
    },
    {
      message: "Invalid PAN format (must be like ABCDE1234F)",
      path: ["panNumber"],
    }
  )
  // ✅ NEW: Self-validation for GST - only triggers after exactly 15 chars
  .refine(
    (data) => {
      const gst = data.gstNumber;
      return (
        !gst ||
        gst.length !== 15 ||
        /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(gst)
      );
    },
    {
      message: "Invalid GSTIN format (must be like 22AAAAA0000A1Z5)",
      path: ["gstNumber"],
    }
  );

export const mobileOtpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, { message: "Invalid OTP" })
    .optional(),
});

export const userProfileSchema = userProfileDataSchema.and(mobileOtpSchema);
