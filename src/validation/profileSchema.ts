import { z } from "zod";
import { loginUserMobileSchema } from "./loginUser";
export const passwordValidation = z.string().refine((value) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
  return regex.test(value);
}, "Password must be at lest 6 characters, 1 uppercase, 1 lowercase, 1 special character");
export const userProfileSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: passwordValidation,
    passwordConfirm: z.string(),
    mobile: loginUserMobileSchema,
    photo: z.string().optional(),
    userRole: z.enum(["retailer", "wholesaler", "distributor", "other"]),
    otherUserRole: z
      .string()
      .min(2, "You should specify your role.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        message: "Passwords do not match",
        path: ["passwordConfirm"],
        code: "custom",
      });
    }
  });
export const registerUserPhoneSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, { message: "Invalid mobile number" }),
});
export const mobileOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, { message: "Invalid OTP" }),
});
