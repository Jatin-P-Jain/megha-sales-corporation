"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { loginUserSchema } from "@/validation/loginUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";

const CollapsibleLoginForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
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
    } catch (e: unknown) {
      console.log({ e });

      toast.error("Error!", {
        description:
          (e as { code?: string })?.code === "auth/invalid-credential"
            ? "Invalid Credential"
            : "An error occurred",
      });
    }
  };
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="mx-auto w-full gap-0 p-2">
        <CardHeader className="flex items-center justify-between px-2 md:p-2">
          <CardTitle className="text-xs font-semibold sm:text-sm md:text-base">
            Continue with Email and Password
          </CardTitle>

          <Button variant="link" size="icon" onClick={() => setOpen(!open)}>
            {open ? (
              <ChevronUp className="size-6" />
            ) : (
              <ChevronDown className="size-6" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={`${
            open
              ? "max-h-[1000px] p-2 opacity-100 md:py-4"
              : "pointer-events-none max-h-0 opacity-0"
          } transition-all duration-500 ease-in-out`}
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Your Password"
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      Forgot your password?
                      <Link
                        href="/forgot-password"
                        className="text-cyan-900 underline"
                      >
                        Reset it here.
                      </Link>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full tracking-wide uppercase">
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollapsibleLoginForm;
