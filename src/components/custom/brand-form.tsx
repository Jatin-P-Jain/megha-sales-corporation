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
import { capitalizePhrase } from "@/lib/capitalize";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

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
    vehicleCategory: "",
    vehicleCompanies: [],
    vehicleNames: [],
    partCategories: [],
    description: "",
    status: "draft",
    brandWebsite: "",
    brandMedia: [],
    ...defaultValues,
  };

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: combineDefaultValues,
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-0 md:gap-6"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 items-start justify-center gap-4 md:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-start gap-1">
                      Status
                      <span className="text-muted-foreground text-xs">*</span>
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
                    <FormLabel className="flex items-start gap-1">
                      Brand Name
                      <span className="text-muted-foreground text-xs">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        {...field}
                        value={capitalizePhrase(field.value)}
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
              {/* Status */}
            </div>
            {/* Brand Logo */}
            <FormField
              control={form.control}
              name="brandLogo"
              render={({ field }) => (
                <FormItem className="h-full">
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
          <FormField
            control={form.control}
            name="vehicleCategory"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-start gap-1">
                  Deals in Vehicle Category
                  <span className="text-muted-foreground text-xs">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="ml-4 flex flex-col gap-4 md:flex-row md:items-center"
                  >
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="lcv"
                        id="vehicle-category-lcv"
                        disabled={isSubmitting}
                        className="border-input bg-background text-background-foreground focus:ring-ring h-4 w-4 rounded-full border focus:ring-3"
                      />
                      <span className="text-sm">
                        Light Commercial Vehicle (LCV)
                      </span>
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="hcv"
                        id="vehicle-category-hcv"
                        disabled={isSubmitting}
                        className="border-input bg-background text-background-foreground focus:ring-ring h-4 w-4 rounded-full border focus:ring-2"
                      />
                      <span className="text-sm">
                        Heavy Commercial Vehicle (HCV)
                      </span>
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <RadioGroupItem
                        value="both"
                        id="vehicle-category-universal"
                        disabled={isSubmitting}
                        className="border-input bg-background text-background-foreground focus:ring-ring h-4 w-4 rounded-full border focus:ring-2"
                      />
                      <span className="text-sm">LCV & HCV</span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

          <div className="grid grid-cols-1 items-start justify-center gap-4 md:grid-cols-[1fr_2fr]">
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
                      className="flex resize-none md:h-50"
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

          {/* Brand Website */}
          <FormField
            control={form.control}
            name="brandWebsite"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-start gap-1">
                  Brand Website
                  <span className="text-muted-foreground text-xs">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    {...field}
                    placeholder="Provide the brand's offical website"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="mx-auto flex w-full max-w-md gap-2"
          disabled={isSubmitting}
        >
          {submitButtonLabel}
        </Button>
      </form>
    </Form>
  );
}
