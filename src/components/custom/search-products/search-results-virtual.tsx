"use client";

import React from "react";
import { Virtuoso } from "react-virtuoso";
import type { Product } from "@/types/product";
import ProductCard from "../product-card";

export default function SearchResultsVirtual({
  items,
  isAdmin,
  fillHeight = false,
}: {
  items: Product[];
  isAdmin: boolean;
  fillHeight?: boolean;
}) {
  // Virtuoso must have a height (either here or via parent flex styles). [web:233]
  const itemApproxHeight = 250;
  const maxHeight = 520;
  const height = fillHeight
    ? "100%"
    : Math.min(items.length * itemApproxHeight, maxHeight);

  return (
    <div className={fillHeight ? "h-full" : ""}>
      <Virtuoso
        style={{ height, width: "100%" }}
        data={items}
        computeItemKey={(_, item) => item.id}
        itemContent={(_, product) => (
          <div className="py-1 px-4 md:px-2">
            <ProductCard product={product} isAdmin={isAdmin} />
          </div>
        )}
      />
    </div>
  );
}
