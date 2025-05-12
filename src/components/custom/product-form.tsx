"use client";

import { productSchema } from "@/validation/productSchema";
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
import MultiImageUploader from "./multi-media-uploader";
import { Brand } from "@/types/brand";
import { capitalize } from "@/lib/capitalize";
import { ImageUpload } from "./image-uploader";

type Props = {
  submitButtonLabel: React.ReactNode;
  handleSubmit: (data: z.infer<typeof productSchema>) => void;
  defaultValues?: z.infer<typeof productSchema>;
  brand: Brand;
};

export default function ProductForm({
  handleSubmit,
  submitButtonLabel,
  defaultValues,
  brand,
}: Props) {
  const combineDefaultValues: z.infer<typeof productSchema> = {
    brandName: brand.brandName,
    companyName: "",
    vehicleCompany: "",
    vehicleName: "",
    partCategory: "",
    partNumber: "",
    partName: "",
    price: 0,
    discount: 0,
    gst: 0,
    description: "",
    status: "draft",
    images: [],
    ...defaultValues,
  };

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: combineDefaultValues,
  });

  const { isSubmitting } = form.formState;

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="">
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 ">
            {/* Brand Name */}
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input readOnly {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={capitalize(field.value.trim())}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={"Select Company"} />
                      </SelectTrigger>
                      <SelectContent>
                        {brand?.companies?.map((company, i) => {
                          return (
                            <SelectItem value={company} key={i}>
                              {company}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Vehicle Company Name*/}
            <FormField
              control={form.control}
              name="vehicleCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Comany Name</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={"Select Vehicle Company"} />
                      </SelectTrigger>
                      <SelectContent>
                        {brand?.vehicleCompanies?.map((vehicleCompany, i) => {
                          return (
                            <SelectItem value={vehicleCompany} key={i}>
                              {vehicleCompany}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Vehicle Name */}
            <FormField
              control={form.control}
              name="vehicleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Name</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={"Select Vehicle Name"} />
                      </SelectTrigger>
                      <SelectContent>
                        {brand?.vehicleNames?.map((vehicleName, i) => {
                          return (
                            <SelectItem value={vehicleName} key={i}>
                              {vehicleName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-3 md:col-span-2 md:grid md:grid-cols-3 md:gap-6">
              {/* Part Category */}
              <FormField
                control={form.control}
                name="partCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Category</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={"Select Part Category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {brand?.partCategories?.map((partCategory, i) => {
                            return (
                              <SelectItem value={partCategory} key={i}>
                                {partCategory}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Part Number */}
              <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Number</FormLabel>
                    <FormControl>
                      <Input disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Part Name */}
              <FormField
                control={form.control}
                name="partName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name</FormLabel>
                    <FormControl>
                      <Input disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Price, Discount, GST Row */}
            <div className="col-span-2 grid grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gst"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST</FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
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
                        <SelectItem value="for-sale">For Sale</SelectItem>
                        <SelectItem value="out-of-stock">
                          Out of Stock
                        </SelectItem>
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

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} {...field} className="" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Images */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormControl>
                    <MultiImageUploader
                      disabled={isSubmitting}
                      media={field.value}
                      onMediaChange={(images: ImageUpload[]) => {
                        form.setValue("images", images);
                      }}
                      urlFormatter={(image) =>
                        !image.file
                          ? `https://firebasestorage.googleapis.com/v0/b/hot-homes-8a814.firebasestorage.app/o/${encodeURIComponent(
                              image.url
                            )}?alt=media`
                          : image.url
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
    </div>
  );
}
