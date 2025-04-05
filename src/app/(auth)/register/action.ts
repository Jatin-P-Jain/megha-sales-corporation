"use server";

import { auth } from "@/firebase/server";
import { registerUserSchema } from "@/validation/registerUser";

export const registerUser = async (data: {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
}) => {
  const validation = registerUserSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message ?? "An Error Occurred",
    };
  }
  try {
    await auth.createUser({
      displayName: data.name,
      email: data.email,
      password: data.password,
    });
  } catch (e: any) {
    console.log({ e });

    return {
      error: true,
      message:
        e.code == "auth/email-already-exists"
          ? "The email address is already in use by another account."
          : "Could not register user",
    };
  }
};
