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
import { userProfileSchema } from "@/validation/profileSchema";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  defaultValues,
}: {
  defaultValues?: z.infer<typeof userProfileSchema>;
}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues,
  });
  const handleSubmit = async (data: z.infer<typeof userProfileSchema>) => {
    console.log({ data });
    router.push("/");
    // const response = await updateUserProfile(data);
    // if (!!response?.error) {
    //   toast.error("Error!", { description: response.message });
    // } else {
    //   toast.success("Success!", {
    //     description: "Your account has been created successfully!",
    //   });
    //   window.location.assign("/login");
    // }
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
            <Button
              type="submit"
              className="w-full cursor-pointer tracking-wide uppercase"
            >
              Continue
            </Button>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
