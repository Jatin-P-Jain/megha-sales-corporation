"use client";

import { brandSchema } from "@/validation/brandSchema";
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
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { TagInput } from "./tag-input";
import MultiMediaUploader, { MediaUpload } from "./multi-media-uploader";
import ImageUploader, { ImageUpload } from "./image-uploader";
import { capitalize } from "@/lib/capitalize";
import imageUrlFormatter from "@/lib/image-urlFormatter";

type Props = {
  progressMap?: Record<string, number>;
  submitButtonLabel: React.ReactNode;
  handleSubmit: (data: z.infer<typeof brandSchema>) => void;
  defaultValues?: z.infer<typeof brandSchema>;
};

export default function BrandForm({
  progressMap,
  handleSubmit,
  submitButtonLabel,
  defaultValues,
}: Props) {
  const combineDefaultValues: z.infer<typeof brandSchema> = {
    brandName: "",
    brandLogo: { id: "", url: "" },
    companies: [],
    vehicleCompanies: [],
    vehicleNames: [],
    partCategories: [],
    description: "",
    status: "draft",
    brandMedia: [],
    ...defaultValues,
  };

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: combineDefaultValues,
  });

  const { isSubmitting } = form.formState;
  console.log({ combineDefaultValues });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-0 md:gap-6"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 justify-center items-start ">
            <div className="flex flex-col gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-col ">
                    <FormLabel className="gap-1 flex items-start">
                      Status
                      <span className="text-xs text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="discontinued">
                            Discontinued
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Brand Name */}
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="gap-1 flex items-start">
                      Brand Name
                      <span className="text-xs text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        {...field}
                        value={capitalize(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Company Name */}
              <FormField
                control={form.control}
                name="companies"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TagInput
                        label="Company Names"
                        values={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        placeholder="Add a company and press Enter"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Brand Logo */}
            <FormField
              control={form.control}
              name="brandLogo"
              render={({ field }) => (
                <FormItem className=" h-full">
                  <FormControl>
                    <ImageUploader
                      parent="brand"
                      progressMap={progressMap}
                      disabled={isSubmitting}
                      image={field.value}
                      onMediaChange={(image: ImageUpload) => {
                        if (image) form.setValue("brandLogo", image);
                        else form.setValue("brandLogo", { id: "", url: "" });
                      }}
                      urlFormatter={(image) =>
                        image?.url && !image?.file
                          ? imageUrlFormatter(image?.url)
                          : image?.url || ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Vehicle Company */}
          <FormField
            control={form.control}
            name="vehicleCompanies"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagInput
                    label="Vehicle Company Names"
                    values={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Add a vehicle company and press Enter"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vehicle Names */}
          <FormField
            control={form.control}
            name="vehicleNames"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagInput
                    label="Vehicle Names"
                    values={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Add a vehicle company and press Enter"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Part Category */}
          <FormField
            control={form.control}
            name="partCategories"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagInput
                    label="Part Categories"
                    values={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Add a part category and press Enter"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 justify-center items-start">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      {...field}
                      className="resize-none md:h-50 flex"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media */}
            <FormField
              control={form.control}
              name="brandMedia"
              render={({ field }) => (
                <FormItem className="flex">
                  <FormControl>
                    <MultiMediaUploader
                      progressMap={progressMap}
                      disabled={isSubmitting}
                      media={field.value}
                      onMediaChange={(media: MediaUpload[]) => {
                        form.setValue("brandMedia", media);
                      }}
                      urlFormatter={(image) =>
                        !image.file ? imageUrlFormatter(image?.url) : image.url
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="max-w-md mx-auto w-full flex gap-2"
          disabled={isSubmitting}
        >
          {submitButtonLabel}
        </Button>
      </form>
    </Form>
  );
}
