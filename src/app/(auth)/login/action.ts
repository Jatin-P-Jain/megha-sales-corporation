import { useAuth } from "@/context/auth";
import { loginUserSchema } from "@/validation/loginUser";

export const loginUser = async (data: { email: string; password: string }) => {
  const auth = useAuth();
};
