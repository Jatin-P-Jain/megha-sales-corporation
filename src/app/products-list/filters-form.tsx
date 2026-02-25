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
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minBedrooms: z.string().optional(),
});

export default function FiltersForm({ openFilters }: { openFilters: boolean }) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useSafeRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      minBedrooms: searchParams.get("minBedrooms") ?? "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
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
    startTransition(() => {
      router.push(`/property-search?${newSearchParams.toString()}`);
    });
  };
  return (
    <div
      className={`overflow-hidden transition-all duration-500 ease-in-out ${
        openFilters ? "max-h-[1000px] pt-3 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={`grid grid-cols-1 gap-3 sm:grid-cols-4`}
        >
          <FormField
            control={form.control}
            name="minPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="px-1 text-xs text-gray-700">
                  Minimum Price
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Min Price"
                    type="number"
                    min={0}
                    disabled={isPending}
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
                <FormLabel className="px-1 text-xs text-gray-700">
                  Maximum Price
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Max Price"
                    type="number"
                    min={0}
                    disabled={isPending}
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
                <FormLabel className="px-1 text-xs text-gray-700">
                  Minimum Bedrooms
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Min Bedrooms"
                    type="number"
                    min={0}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-auto w-full cursor-pointer">
            {isPending ? "Applying Filters" : "Apply Filters"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
