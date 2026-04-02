"use client";

import React from "react";
import { Virtuoso } from "react-virtuoso";
import type { Product } from "@/types/product";
import ProductCard from "../product-card";

export default function SearchResultsVirtual({
  items,
  isAdmin,
  onClose,
}: {
  items: Product[];
  isAdmin: boolean;
  onClose: () => void;
}) {
  // Virtuoso must have a height (either here or via parent flex styles). [web:233]
  const itemApproxHeight = 150;
  const maxHeight = 520;
  const height = Math.min(items.length * itemApproxHeight, maxHeight);

  return (
    <div className="px-0">
      <Virtuoso
        style={{ height, width: "100%" }}
        data={items}
        computeItemKey={(_, item) => item.id}
        itemContent={(_, product) => (
          <div className="px-4 py-1">
            <ProductCard
              product={product}
              isAdmin={isAdmin}
              onClose={onClose}
            />
          </div>
        )}
      />
    </div>
  );
}
