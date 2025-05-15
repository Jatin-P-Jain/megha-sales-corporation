"use client";

import { productDataSchema, productSchema } from "@/validation/productSchema";
import { ControllerRenderProps, useForm } from "react-hook-form";
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
import ImageUploader, { ImageUpload } from "./image-uploader";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { TagInput } from "./tag-input";
import { useEffect } from "react";

type Props = {
  progressMap?: Record<string, number>;
  submitButtonLabel: React.ReactNode;
  handleSelectBrand?: (brand: Brand) => void;
  handleSubmit: (data: z.infer<typeof productSchema>) => void;
  defaultValues?: z.infer<typeof productSchema>;
  brand?: Brand;
  allBrands?: Brand[];
};

export default function ProductForm({
  progressMap,
  handleSelectBrand,
  handleSubmit,
  submitButtonLabel,
  defaultValues,
  brand,
  allBrands,
}: Props) {
  const combineDefaultValues: z.infer<typeof productSchema> = {
    brandName: brand?.brandName ?? "",
    companyName: brand?.companies.length === 1 ? brand?.companies[0] : "",
    vehicleCompany:
      brand?.vehicleCompanies.length === 1 ? brand?.vehicleCompanies?.[0] : "",
    vehicleName: [],
    partCategory:
      brand?.partCategories.length === 1 ? brand?.partCategories[0] : "",
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
  console.log({ combineDefaultValues });

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: combineDefaultValues,
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (brand) {
      form.setValue("brandName", brand.brandName);
    }
  }, [brand, form]);

  const renderBrandNameField = (
    field: ControllerRenderProps<
      z.infer<typeof productDataSchema>,
      "brandName"
    >,
  ) => {
    if (allBrands && allBrands?.length > 0) {
      return (
        <Select
          disabled={isSubmitting}
          onValueChange={(value: string) => {
            field.onChange(value); // update form field
            const selected = allBrands?.find((b) => b.brandName === value);
            if (selected && handleSelectBrand) handleSelectBrand(selected); // update parent
          }}
          value={field.value}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={"Select Company"} />
          </SelectTrigger>
          <SelectContent>
            {allBrands?.map((brand, i) => {
              return (
                <SelectItem value={brand?.brandName} key={i}>
                  {brand?.brandName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    }
    return <Input readOnly {...field} />;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Brand Name */}
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel className="flex items-start gap-1">
                    Brand Name
                    <span className="text-muted-foreground text-xs">*</span>
                  </FormLabel>
                  <FormControl>{renderBrandNameField(field)}</FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel className="flex items-start gap-1">
                      Company Name
                      <span className="text-muted-foreground text-xs">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting || !brand}
                        onValueChange={field.onChange}
                        value={field.value}
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
                );
              }}
            />
          </div>
          <div className="grid grid-cols-1 items-start justify-center gap-4 md:grid-cols-2">
            {/* Vehicle Company Name*/}
            <FormField
              control={form.control}
              name="vehicleCompany"
              render={({ field }) => {
                return (
                  <FormItem className="">
                    <FormLabel className="flex items-start gap-1">
                      Vehicle Company
                      <span className="text-muted-foreground text-xs">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting || !brand}
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
                );
              }}
            />
            {/* Vehicle Name */}
            <FormField
              control={form.control}
              name="vehicleName"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormControl>
                      <TagInput
                        label="Vehicle Names"
                        values={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting || !brand}
                        placeholder="Add a vehicle name/model/make and press Enter"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          {/* Part Category, Name, Number Row */}
          <div className="grid grid-cols-1 items-start justify-center gap-3 md:col-span-2 md:grid md:grid-cols-3 md:gap-6">
            {/* Part Category */}
            <FormField
              control={form.control}
              name="partCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-start gap-1">
                    Part Category
                    <span className="text-muted-foreground text-xs">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting || !brand}
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
                  <FormLabel className="flex items-start gap-1">
                    Part Name
                    <span className="text-muted-foreground text-xs">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting || !brand} {...field} />
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
                  <FormLabel className="flex items-start gap-1">
                    Part Number
                    <span className="text-muted-foreground text-xs">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting || !brand} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Price, Discount, GST Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr]">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-start gap-1">
                    Price (₹)
                    <span className="text-muted-foreground text-xs">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting || !brand}
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
                    <FormLabel className="flex items-start gap-1">
                      Discount (%)
                      <span className="text-muted-foreground text-xs">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting || !brand}
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
                    <FormLabel className="flex items-start gap-1">
                      GST (%)
                      <span className="text-muted-foreground text-xs">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting || !brand}
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
                <FormLabel className="flex items-start gap-1">
                  Status
                  <span className="text-muted-foreground text-xs">*</span>
                </FormLabel>
                <FormControl>
                  <Select
                    disabled={isSubmitting || !brand}
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
                <FormLabel className="flex items-start gap-1">
                  Items in the Stock
                  <span className="text-muted-foreground text-xs">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={isSubmitting || !brand}
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
                    disabled={isSubmitting || !brand}
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
          className="mx-auto mt-4 flex w-full max-w-md gap-2"
          disabled={isSubmitting || !brand}
        >
          {submitButtonLabel}
        </Button>
      </form>
    </Form>
  );
}
