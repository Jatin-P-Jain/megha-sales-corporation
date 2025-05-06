import { z } from "zod";
import { passwordValidation } from "./registerUser";
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: passwordValidation,
});
export const loginUserMobileSchema = z.object({
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, { message: "Invalid mobile number" }),
});
export const mobileOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, { message: "Invalid OTP" }),
});
