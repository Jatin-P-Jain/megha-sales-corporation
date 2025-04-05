"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loginUserSchema } from "@/validation/loginUser";

import Link from "next/link";
import { useAuth } from "@/context/auth";
import GoogleLoginButton from "@/components/custom/google-login-button";

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const form = useForm<z.infer<typeof loginUserSchema>>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const handleSubmit = async (data: z.infer<typeof loginUserSchema>) => {
    const validation = loginUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        error: true,
        message: validation.error.issues[0]?.message ?? "An Error Occurred",
      };
    }
    try {
      await auth?.loginWithEmailAndPassword(data);
      onSuccess?.();
    } catch (e: any) {
      console.log({ e });

      toast.error("Error!", {
        description:
          e.code == "auth/invalid-credential"
            ? "Invalid Credential"
            : "An error occurred",
      });
    }
  };
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <fieldset
            className="flex flex-col gap-5"
            disabled={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your Password"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex gap-2 items-center text-sm">
                      Forgot your password?
                      <Link
                        href={"/forgot-password"}
                        className="text-sky-900 underline"
                      >
                        Reset it here.
                      </Link>
                    </div>
                  </FormItem>
                );
              }}
            />
            <Button
              type="submit"
              className="w-full uppercase tracking-wide cursor-pointer"
            >
              Login
            </Button>
          </fieldset>
        </form>
      </Form>
      <span className="w-full flex justify-center text-zinc-500 text-[14px] my-4">
        or
      </span>
      <GoogleLoginButton variant={"outline"} onSuccess={onSuccess} />
      <div className="flex gap-2 justify-center items-center mt-4 text-sm">
        Don&apos;t have an account?
        <Link href={"/register"} className="text-sky-900 underline">
          Register here.
        </Link>
      </div>
    </div>
  );
}
