import { z } from "zod";
export const userProfileDataSchema = z
  .object({
    email: z.string().email(),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    gstNumber: z
      .string()
      .regex(
        /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/,
        "Invalid GSTIN format (must be 15 characters)",
      )
      .optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, { message: "Invalid mobile number" }),
    photoUrl: z.string().optional(),
    role: z
      .enum(["retailer", "wholesaler", "distributor", "admin", "other"])
      .or(z.string())
      .optional(),
    otherUserRole: z
      .string()
      .min(2, "You should specify your role.")
      .optional(),
  })
  .refine((data) => data.role !== "other" || !!data.otherUserRole, {
    message: "You must specify your role.",
    path: ["otherUserRole"],
  });
export const mobileOtpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, { message: "Invalid OTP" })
    .optional(),
});
export const userProfileSchema = userProfileDataSchema.and(mobileOtpSchema);
