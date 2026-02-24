"use client";

import React from "react";
import SearchProducts from "../search-products/search-products";
import AuthButtons from "../auth-buttons";

export default function NavBarClientRight() {
  return (
    <div className="inline-flex h-full items-center gap-2 md:gap-3">
      <SearchProducts buttonClassName="text-primary font-medium md:!px-20" />
      <div className="bg-accent h-8 w-px" />
      <AuthButtons />
    </div>
  );
}
