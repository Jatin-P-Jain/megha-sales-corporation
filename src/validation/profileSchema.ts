import { z } from "zod";

export const userProfileDataSchema = z
  .object({
    email: z.string().email(),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    businessIdType: z.enum(["pan", "gst"]).optional(),
    panNumber: z.string().optional(), // ✅ Kept optional
    firmName: z.string().optional(), // ✅ Kept optional
    gstNumber: z.string().optional(), // ✅ Kept optional
    phone: z
      .string()
      .trim()
      .superRefine((val, ctx) => {
        if (!val) return; // allow empty
        if (val.length < 10) return;
        if (val.length > 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Mobile number must be 10 digits",
          });
          return;
        }
        if (!/^[6-9]\d{9}$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid mobile number",
          });
        }
      }),
    photoUrl: z.string().optional(),
    businessType: z
      .enum(["retailer", "wholesaler", "distributor", "other"])
      .or(z.string()),
    otherBusinessType: z
      .string()
      .min(2, "You must specify your business type.")
      .optional(),
  })
  .refine((data) => data.businessType !== "other" || !!data.otherBusinessType, {
    message: "You must specify your business type.",
    path: ["otherBusinessType"],
  })
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
  .refine(
    (data) => {
      const firmName = data.firmName;
      return !firmName || firmName.length >= 2;
    },
    {
      message: "Firm/Business Name must be at least 2 characters",
      path: ["firmName"],
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
    .trim()
    .optional()
    .superRefine((val, ctx) => {
      if (!val) return; // allow empty
      if (val.length < 6) return; // don't error while typing
      if (val.length > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "OTP must be 6 digits",
        });
        return;
      }
      if (!/^\d{6}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid OTP",
        });
      }
    }),
});

export const userProfileSchema = userProfileDataSchema.and(mobileOtpSchema);
