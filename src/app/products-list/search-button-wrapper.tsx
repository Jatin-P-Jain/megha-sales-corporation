"use client";
import SearchPartNumber from "@/components/custom/search-part-number";
import useIsMobile from "@/hooks/useIsMobile";
import React from "react";

export default function SearchButtonWrapper() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SearchPartNumber
        variant="default"
        buttonClassName="ring-4 ring-muted shadow-xl rounded-full"
      />
    );
  }

  return null;
}
