"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minBedrooms: z.string().optional(),
});

export default function FiltersForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      minBedrooms: searchParams.get("minBedrooms") ?? "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("data -- ", data);
    const newSearchParams = new URLSearchParams();
    if (data.minPrice) {
      newSearchParams.set("minPrice", data.minPrice);
    }
    if (data.maxPrice) {
      newSearchParams.set("maxPrice", data.maxPrice);
    }
    if (data.minBedrooms) {
      newSearchParams.set("minBedrooms", data.minBedrooms);
    }
    newSearchParams.set("page", "1");
    router.push(`/property-search?${newSearchParams.toString()}`);
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid grid-cols-4 gap-3"
      >
        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs px-1 text-gray-700">
                Minimum Price
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Min Price"
                  type="number"
                  min={0}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs px-1 text-gray-700">
                Maximum Price
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Max Price"
                  type="number"
                  min={0}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minBedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs px-1 text-gray-700">
                Minimum Bedrooms
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Min Bedrooms"
                  type="number"
                  min={0}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full cursor-pointer mt-auto">
          Search
        </Button>
      </form>
    </Form>
  );
}
