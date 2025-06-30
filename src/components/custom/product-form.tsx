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
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { XIcon } from "lucide-react";
import clsx from "clsx";

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
    vehicleNames: [],
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
    hasSizes: false,
    samePriceForAllSizes: false,
    sizes: [],
    ...defaultValues,
  };

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
              name="vehicleNames"
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

          <div className="flex flex-col justify-between gap-8 rounded-md border p-3 shadow-sm md:flex-row">
            <div className="flex flex-col gap-3 md:w-1/4 md:gap-4">
              <FormField
                control={form.control}
                name="hasSizes"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        Sizes Available?
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || !brand}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch("hasSizes") && (
                <FormField
                  control={form.control}
                  name="samePriceForAllSizes"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3">
                      <FormLabel className="text-sm font-medium">
                        Same price for all sizes?
                      </FormLabel>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting || !brand}
                          className="size-5"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            {form.watch("hasSizes") && (
              <FormField
                control={form.control}
                name="sizes"
                render={({ field }) => (
                  <FormItem className="flex items-end justify-end gap-2 md:w-3/4">
                    <FormControl>
                      <div className="flex w-full flex-col items-end justify-end gap-4">
                        {field.value?.map((entry, idx) => (
                          <div
                            key={idx}
                            className={clsx(
                              "grid grid-cols-[1fr_2fr_auto] items-end justify-end gap-2",
                              form.watch("samePriceForAllSizes") &&
                                "w-3/4 grid-cols-[1fr_auto]",
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              <FormLabel>Size</FormLabel>
                              <Input
                                placeholder="Enter Size"
                                value={entry.size}
                                onChange={(e) => {
                                  const updated = [...field.value];
                                  updated[idx].size = e.target.value;
                                  field.onChange(updated);
                                }}
                                className=""
                              />
                            </div>
                            {!form.watch("samePriceForAllSizes") && (
                              <div className="flex w-full gap-1">
                                <div className="flex flex-col gap-1">
                                  <FormLabel>Price(₹)</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="Price"
                                    value={
                                      Number.isFinite(entry.price)
                                        ? entry.price
                                        : ""
                                    }
                                    onFocus={() => {
                                      if (entry.price === 0) {
                                        const updated = [...field.value];
                                        updated[idx].price = NaN; // temporarily clear value
                                        field.onChange(updated);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value;
                                      const updated = [...field.value];
                                      updated[idx].price =
                                        val === "" || isNaN(Number(val))
                                          ? 0
                                          : Number(val);
                                      field.onChange(updated);
                                    }}
                                    onChange={(e) => {
                                      const updated = [...field.value];
                                      updated[idx].price = Number(
                                        e.target.value,
                                      );
                                      field.onChange(updated);
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <FormLabel>Disc.(%)</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="Discount (%)"
                                    value={entry.discount}
                                    onChange={(e) => {
                                      const updated = [...field.value];
                                      updated[idx].discount = Number(
                                        e.target.value,
                                      );
                                      field.onChange(updated);
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <FormLabel>GST (%)</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="GST (%)"
                                    value={entry.gst}
                                    onChange={(e) => {
                                      const updated = [...field.value];
                                      updated[idx].gst = Number(e.target.value);
                                      field.onChange(updated);
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant={"link"}
                              onClick={() => {
                                const updated = [...field.value];
                                updated.splice(idx, 1);
                                field.onChange(updated);
                              }}
                            >
                              <XIcon className="text-muted-foreground size-6 rounded-full border p-1" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            field.onChange([
                              ...(field.value ?? []),
                              { size: "" },
                            ])
                          }
                          className="border-primary hover:bg-primary/10 text-primary w-fit"
                        >
                          + Add Size
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Price, Discount, GST Row */}
          {(!form.watch("hasSizes") || form.watch("samePriceForAllSizes")) && (
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
          )}

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
