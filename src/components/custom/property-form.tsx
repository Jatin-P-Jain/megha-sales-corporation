"use client";

import { propertySchema } from "@/validation/propertySchema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import MultiImageUploader, { ImageUpload } from "./multi-image-uploader";

type Props = {
  submitButtonLabel: React.ReactNode;
  handleSubmit: (data: z.infer<typeof propertySchema>) => void;
  defaultValues?: z.infer<typeof propertySchema>;
};

export default function PropertyForm({
  handleSubmit,
  submitButtonLabel,
  defaultValues,
}: Props) {
  const combineDefaultValues: z.infer<typeof propertySchema> = {
    ...{
      address1: "",
      address2: "",
      city: "",
      postalCode: "",
      price: 0,
      description: "",
      bathrooms: 0,
      bedrooms: 0,
      status: "draft",
      images: [],
    },
    ...defaultValues,
  };
  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: combineDefaultValues,
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid grid-cols-2 gap-6">
          <fieldset
            className="flex flex-col gap-3"
            disabled={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="for-sale">For Sale</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="address1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="address2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          </fieldset>
          <fieldset
            className="flex flex-col gap-3"
            disabled={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathrooms</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[6rem] h-auto resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          </fieldset>
        </div>
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultiImageUploader
                  onImagesChange={(images: ImageUpload[]) => {
                    form.setValue("images", images);
                  }}
                  images={field.value}
                  disabled={form.formState.isSubmitting} // Added disabled prop
                  urlFormatter={(image: ImageUpload) => {
                    if (!image.file) {
                      return `https://firebasestorage.googleapis.com/v0/b/hot-homes-8a814.firebasestorage.app/o/${encodeURIComponent(
                        image.url
                      )}?alt=media`;
                    }
                    return image.url;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>

        <Button
          type="submit"
          className="max-w-md mx-auto mt-2 w-full flex gap-2"
          disabled={form.formState.isSubmitting}
        >
          {submitButtonLabel}
        </Button>
      </form>
    </Form>
  );
}
