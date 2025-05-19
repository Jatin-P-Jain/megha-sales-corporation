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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { mobileOtpSchema } from "@/validation/loginUser";
import OTPInput from "../otp-input";

export function OtpVerificationForm({
  onSubmit,
  isVerifying,
}: {
  onSubmit: (otp: string) => void;
  isVerifying: boolean;
}) {
  const form = useForm<z.infer<typeof mobileOtpSchema>>({
    resolver: zodResolver(mobileOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data.otp))}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter OTP</FormLabel>
              <FormControl>
                <Controller
                  name={field.name}
                  control={form.control}
                  render={({ field: { value, onChange } }) => (
                    <OTPInput value={value} onChange={onChange} length={6} />
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {isVerifying ? (
            <>
              <Loader2 className="animate-spin" /> Verifying OTP
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </form>
    </Form>
  );
}
