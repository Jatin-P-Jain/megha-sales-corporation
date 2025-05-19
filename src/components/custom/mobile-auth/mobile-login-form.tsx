import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUserMobileSchema } from "@/validation/loginUser";

export function MobileLoginForm({
  onSubmit,
  sendingOtp,
}: {
  onSubmit: (mobile: string) => void;
  sendingOtp: boolean;
}) {
  const form = useForm<z.infer<typeof loginUserMobileSchema>>({
    resolver: zodResolver(loginUserMobileSchema),
    defaultValues: {
      mobile: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data.mobile))}>
        <fieldset
          className="flex flex-col gap-5"
          disabled={form.formState.isSubmitting}
        >
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Mobile Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mobile Number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            {sendingOtp ? (
              <>
                <Loader2 className="animate-spin" />
                Sending OTP
              </>
            ) : (
              "Login with OTP"
            )}
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
