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
import { useAuth } from "@/context/auth";
import { auth } from "@/firebase/client";
import { passwordValidation } from "@/validation/registerUser";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updateFormSchema = z
  .object({
    currentPassword: passwordValidation,
    newPassword: passwordValidation,
    confirmNewPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
        code: "custom",
      });
    }
  });
export default function UpdatePasswordForm() {
  const form = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });
  const auth = useAuth();
  const handleSubmit = async (data: z.infer<typeof updateFormSchema>) => {
    const user = auth?.currentUser;
    if (!user?.email) {
      return;
    }
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, data.currentPassword)
      );
      await updatePassword(user, data.newPassword);
      toast.success("Password updated successfully!", {
        description: "Your password was updated.",
      });
      form.reset();
    } catch (e: any) {
      console.log({ e });
      if (e.code === "auth/invalid-credential") {
        toast.error("Invalid credentials", {
          description: "Please check your current password and try again.",
        });
      } else {
        toast.error("Error!", {
          description: "An error occurred.",
        });
      }
    }

    console.log(data);
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
              name="currentPassword"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Current Password"
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
              name="newPassword"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="New Password"
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
              name="confirmNewPassword"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Confirm New Password"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Button type="submit" className="w-full uppercase tracking-wide">
              Update Password
            </Button>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
