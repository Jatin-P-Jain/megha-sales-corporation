"use server";
import { registerUserSchema } from "@/validation/registerUser";

export const updateUserProfile = async (data: {
  email: string;
  name: string;
}) => {
  const validation = registerUserSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message ?? "An Error Occurred",
    };
  }
  try {
  } catch (e: unknown) {
    console.log({ e });

    return {
      error: true,
      message:
        (e as { code?: string }).code === "auth/email-already-exists"
          ? "The email address is already in use by another account."
          : "Could not register user",
    };
  }
};
