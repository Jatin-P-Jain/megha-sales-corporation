"use client";

import React, { useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { SearchIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PopoverArrow } from "@radix-ui/react-popover";

// 1) Zod schema
const searchSchema = z.object({
  query: z.string().min(1, "Please enter a search term"),
});
type SearchFormValues = z.infer<typeof searchSchema>;

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // 2) Hook up React-Hook-Form
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "" },
  });

  const handleSearch = (values: SearchFormValues) => {
    onSearch(values.query);
    // close popover on mobile
    form.reset();
    if (isMobile) setOpen(false);
  };

  // 3) The inner form UI
  const FormUI = (
    <div className="flex min-w-75 flex-1 rounded-lg border-1">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSearch)}
          className="flex w-full items-center gap-2"
        >
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">Search</FormLabel>
                <FormControl>
                  <Input
                    className="border-0 placeholder:text-xs focus-visible:shadow-none focus-visible:ring-0 md:placeholder:text-white/70"
                    placeholder="Search Part Number or Name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="md:bg-transparent" size={"icon"}>
            <SearchIcon className="" />
          </Button>
        </form>
      </Form>
    </div>
  );

  // 4) Desktop: inline, Mobile: popover
  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost">
            <SearchIcon className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="mx-auto mr-4 w-[90vw] max-w-md p-2">
          <PopoverArrow className="fill-white" />
          {FormUI}
        </PopoverContent>
      </Popover>
    );
  }

  return FormUI;
}
