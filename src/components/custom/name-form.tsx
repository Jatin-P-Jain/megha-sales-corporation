// components/NameForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, User } from "firebase/auth";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define Zod schema for name validation
const NameSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

type NameFormValues = z.infer<typeof NameSchema>;

interface NameFormProps {
  user: User | null;
  onSuccess?: () => void;
}

export function NameForm({ user, onSuccess }: NameFormProps) {
  const router = useRouter();
  // Initialize react-hook-form with Zod resolver
  const form = useForm<NameFormValues>({
    resolver: zodResolver(NameSchema),
    defaultValues: { name: "" },
  });

  // Handle form submission
  const onSubmit = async (values: NameFormValues) => {
    if (!user) return;
    await updateProfile(user, { displayName: values.name });
    router.push("/");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-center">
                Please enter your name to complete the registration.
              </FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full tracking-wide"
          disabled={form.formState.isSubmitting}
        >
          Continue
        </Button>
      </form>
    </Form>
  );
}
