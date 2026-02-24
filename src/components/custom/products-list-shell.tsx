"use client";

import React, { Suspense } from "react";
import ProductCardSkeleton from "@/components/custom/product-card-skeleton";
import ProductList from "@/app/products-list/product-list";

export default function ProductListShell({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <ProductList isAdmin={isAdmin} />
    </Suspense>
  );
}
