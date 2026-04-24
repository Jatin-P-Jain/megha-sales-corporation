"use client";

import React from "react";
import SearchProducts from "../search-products/search-products";
import AuthButtons from "../auth-buttons";

type BrandOption = { id: string; name: string };

export default function NavBarClientRight({
  brands = [],
}: {
  brands?: BrandOption[];
}) {
  return (
    <div className="inline-flex h-full items-center gap-3">
      <SearchProducts
        buttonClassName="text-primary font-medium md:!px-20"
        brands={brands}
      />
      <div className="bg-accent/20 h-8 w-px" />
      <AuthButtons />
    </div>
  );
}
