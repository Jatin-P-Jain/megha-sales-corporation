"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cartContext";
import clsx from "clsx";
import { useState, useEffect, useTransition, useRef } from "react";
import { Skeleton } from "../ui/skeleton";

type SizeChipsProps = {
  productId: string;
  sizes: {
    size: string;
    price?: number;
    discount?: number;
    gst?: number;
  }[];
  onSelectSize: (size: {
    size: string;
    price?: number;
    discount?: number;
    gst?: number;
  }) => void;
};

export default function SizeChips({
  productId,
  sizes,
  onSelectSize,
}: SizeChipsProps) {
  const { cart, loading } = useCart();

  const [hasMounted, setHasMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [stateLoaded, setStateLoaded] = useState(false);
  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);
  useEffect(() => {
    if (sizes.length === 1 && !selectedSize) {
      setSelectedSize(sizes[0].size);
      onSelectSize(sizes[0]);
    }
  }, [sizes, selectedSize, onSelectSize]);
  useEffect(() => {
    const existingItem = cart.find((item) => {
      return item.productId === productId;
    });

    if (existingItem?.selectedSize) {
      setSelectedSize(existingItem.selectedSize);
      setStateLoaded(true);
    } else {
      setStateLoaded(true);
    }
  }, [cart, productId]);

  useEffect(() => {
    if (!isPending) {
      setSelectedSize((prev) => prev); // reset just to trigger effect
    }
  }, [isPending]);

  useEffect(() => {
    if (selectedSize && chipRefs.current[selectedSize]) {
      chipRefs.current[selectedSize]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedSize]);

  function handleSizeClick(sizeValue: string) {
    const sizeObj = sizes.find((s) => s.size === sizeValue);
    if (!sizeObj) return;

    startTransition(() => {
      setSelectedSize(sizeValue);
      onSelectSize(sizeObj);
    });
  }

  const isLoading = !hasMounted || loading || !stateLoaded;

  if (isLoading) {
    return <Skeleton className="flex h-6 w-full" />;
  }

  return (
    <div className="no-scrollbar flex w-full flex-wrap justify-end gap-1">
      {sizes.map(({ size }, index) => {
        const isSel = selectedSize === size;
        return (
          <Button
            key={index}
            ref={(el) => {
              chipRefs.current[size] = el;
            }}
            variant={isSel ? "default" : "outline"}
            onClick={() => handleSizeClick(size)}
            disabled={isPending}
            className={clsx(
              "text-primary border-primary h-fit min-w-max shrink-0 rounded-full px-2 py-0 text-sm",
              isSel && "bg-primary text-white",
              "border",
              isPending && "cursor-wait opacity-60",
            )}
          >
            {size}
          </Button>
        );
      })}
    </div>
  );
}
