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
import { registerUserSchema } from "@/validation/registerUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerUser } from "./action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof registerUserSchema>>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      passwordConfirm: "",
    },
  });
  const handleSubmit = async (data: z.infer<typeof registerUserSchema>) => {
    const response = await registerUser(data);
    if (!!response?.error) {
      toast.error("Error!", { description: response.message });
    } else {
      toast.success("Success!", {
        description: "Your account has been created successfully!",
      });
      router.push("/login");
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
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
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
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Type your password again"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Button
              type="submit"
              className="w-full uppercase tracking-wide cursor-pointer"
            >
              Register
            </Button>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
