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
import { Brand } from "@/types/brand";
import { capitalize } from "@/lib/capitalize";
import ImageUploader, { ImageUpload } from "./image-uploader";
import imageUrlFormatter from "@/lib/image-urlFormatter";

type Props = {
  progressMap?: Record<string, number>;
  submitButtonLabel: React.ReactNode;
  handleSubmit: (data: z.infer<typeof productSchema>) => void;
  defaultValues?: z.infer<typeof productSchema>;
  brand: Brand;
};

export default function ProductForm({
  progressMap,
  handleSubmit,
  submitButtonLabel,
  defaultValues,
  brand,
}: Props) {
  const combineDefaultValues: z.infer<typeof productSchema> = {
    brandName: brand.brandName,
    companyName:
      brand?.companies.length === 0
        ? "NA"
        : brand?.companies.length === 1
        ? brand?.companies[0]
        : "",
    vehicleCompany:
      brand?.vehicleCompanies.length === 0
        ? "NA"
        : brand?.vehicleCompanies.length === 1
        ? brand?.vehicleCompanies?.[0]
        : "",
    vehicleName:
      brand?.vehicleNames && brand?.vehicleNames.length === 0
        ? "NA"
        : brand?.vehicleNames?.length === 1
        ? brand?.vehicleNames?.[0]
        : "",
    partCategory:
      brand?.partCategories.length === 0
        ? "NA"
        : brand?.partCategories.length === 1
        ? brand?.partCategories[0]
        : "",
    partNumber: "",
    partName: "",
    price: 0,
    discount: 0,
    gst: 0,
    stock: 0,
    status: "draft",
    image: { id: "", url: "" },
    ...defaultValues,
  };

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: combineDefaultValues,
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Name */}
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="gap-1 flex items-start">
                    Brand Name
                    <span className="text-xs text-muted-foreground">*</span>
                  </FormLabel>
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
              render={({ field }) => {
                const value =
                  brand?.companies.length > 1
                    ? capitalize(field.value.trim())
                    : brand?.companies?.[0];
                return (
                  <FormItem>
                    <FormLabel className="gap-1 flex items-start">
                      Company Name
                      <span className="text-xs text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      {brand?.companies.length > 1 ? (
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          value={value}
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
                      ) : (
                        <Input
                          readOnly
                          {...field}
                          disabled={brand?.vehicleCompanies?.length === 0}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle Company Name*/}
            <FormField
              control={form.control}
              name="vehicleCompany"
              render={({ field }) => {
                const value =
                  brand?.vehicleCompanies.length > 1
                    ? capitalize(field.value.trim())
                    : brand?.vehicleCompanies?.[0];
                return (
                  <FormItem className="">
                    <FormLabel className="gap-1 flex items-start">
                      Vehicle Company
                      <span className="text-xs text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      {brand?.vehicleCompanies.length > 1 ? (
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          value={value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={"Select Vehicle Company"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {brand?.vehicleCompanies?.map((company, i) => {
                              return (
                                <SelectItem value={company} key={i}>
                                  {company}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          readOnly
                          {...field}
                          disabled={brand?.vehicleCompanies?.length === 0}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {/* Vehicle Name */}
            <FormField
              control={form.control}
              name="vehicleName"
              render={({ field }) => {
                const value =
                  brand?.vehicleNames && brand?.vehicleNames?.length > 1
                    ? capitalize(field.value.trim())
                    : brand?.vehicleCompanies?.[0];
                return (
                  <FormItem>
                    <FormLabel className="gap-1 flex items-start">
                      Vehicle Name
                      <span className="text-xs text-white">*</span>
                    </FormLabel>
                    <FormControl>
                      {brand?.vehicleNames &&
                      brand?.vehicleNames?.length > 1 ? (
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          value={value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={"Select Vehicle Company"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {brand?.vehicleCompanies?.map((company, i) => {
                              return (
                                <SelectItem value={company} key={i}>
                                  {company}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          readOnly
                          {...field}
                          disabled={brand?.vehicleNames?.length === 0}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          {/* Part Category, Name, Number Row */}
          <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid md:grid-cols-3 md:gap-6 justify-center items-start">
            {/* Part Category */}
            <FormField
              control={form.control}
              name="partCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-1 flex items-start">
                    Part Category
                    <span className="text-xs text-muted-foreground">*</span>
                  </FormLabel>
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

            {/* Part Name */}
            <FormField
              control={form.control}
              name="partName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-1 flex items-start">
                    Part Name
                    <span className="text-xs text-muted-foreground">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} {...field} />
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
                  <FormLabel className="gap-1 flex items-start">
                    Part Number
                    <span className="text-xs text-muted-foreground">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Price, Discount, GST Row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-1 flex items-start">
                    Price (₹)
                    <span className="text-xs text-muted-foreground">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      {...field}
                      onFocus={() => {
                        if (field.value === 0) {
                          field.onChange("");
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === "" || isNaN(Number(value))) {
                          field.onChange(0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="gap-1 flex items-start">
                      Discount (%)
                      <span className="text-xs text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting}
                        {...field}
                        onFocus={() => {
                          if (field.value === 0) {
                            field.onChange("");
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === "" || isNaN(Number(value))) {
                            field.onChange(0);
                          }
                        }}
                      />
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
                    <FormLabel className="gap-1 flex items-start">
                      GST (%)
                      <span className="text-xs text-muted-foreground">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting}
                        {...field}
                        onFocus={() => {
                          if (field.value === 0) {
                            field.onChange("");
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === "" || isNaN(Number(value))) {
                            field.onChange(0);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
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
                      <SelectItem value="for-sale">For Sale</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock */}
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="gap-1 flex items-start">
                  Items in the Stock
                  <span className="text-xs text-muted-foreground">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={isSubmitting}
                    {...field}
                    className=""
                    onFocus={() => {
                      if (field.value === 0) {
                        field.onChange("");
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value === "" || isNaN(Number(value))) {
                        field.onChange(0);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Images */}
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormControl>
                  <ImageUploader
                    progressMap={progressMap}
                    disabled={isSubmitting}
                    image={field.value}
                    onMediaChange={(image: ImageUpload) => {
                      if (image) form.setValue("image", image);
                      else form.setValue("image", { id: "", url: "" });
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

        <Button
          type="submit"
          className="max-w-md mx-auto w-full flex gap-2 mt-4"
          disabled={isSubmitting}
        >
          {submitButtonLabel}
        </Button>
      </form>
    </Form>
  );
}
