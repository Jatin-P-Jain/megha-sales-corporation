"use client";
import React from "react";
import Link from "next/link";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import SearchPartNumber from "@/components/custom/search-part-number";

type Props = {
  newSearchParams: URLSearchParams;
};

export function ActionButtonsWrapper({ newSearchParams }: Props) {
  const isMobile = useIsMobile();
  return (
    <div className="flex h-fit flex-col gap-2">
      {!isMobile && (
        <SearchPartNumber buttonClassName="border-2 border-primary text-primary font-semibold" />
      )}
      <Button className="ring-muted w-fit min-w-0 p-5 shadow-xl ring-2" asChild>
        <Link
          href={`/admin-dashboard/new-product?${newSearchParams}`}
          className="min-w-0"
        >
          <PlusCircleIcon className="size-6" />
          Add New Product
        </Link>
      </Button>
    </div>
  );
}

export default ActionButtonsWrapper;
