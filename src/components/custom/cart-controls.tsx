"use client";

import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Loader2Icon, PlusSquareIcon } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "../ui/skeleton";
import clsx from "clsx";
import {
  getCartItemKey,
  useCartActions,
  useCartItem,
  useCartState,
} from "@/context/cartContext";

interface Props {
  productId: string;
  selectedSize?: string;
  productPricing: {
    price?: number;
    discount?: number;
    gst?: number;
  };
  hasSizes?: boolean;
  isCartPage?: boolean;
  isDisabled?: boolean;
}

export default function CartControls({
  productId,
  productPricing,
  selectedSize,
  hasSizes,
  isCartPage = false,
  isDisabled = false,
}: Props) {
  const { loading } = useCartState();
  const { increment, decrement, addToCart } = useCartActions();

  const [loadingAction, setLoadingAction] = useState<
    "add" | "inc" | "dec" | null
  >(null);

  // Determine the cart item key used in Firestore docs
  const cartItemKey = useMemo(() => {
    if (isCartPage) return productId;
    return getCartItemKey(productId, hasSizes ? selectedSize : undefined);
  }, [isCartPage, productId, hasSizes, selectedSize]);

  // Subscribe to only this one item
  const item = useCartItem(cartItemKey);

  const qty = item?.quantity ?? 0;

  // If item exists, trust its selectedSize; else fallback to prop
  const selectedSizeValue = item?.selectedSize ?? selectedSize ?? "";

  // For animation direction, store previous qty locally (simple + no custom hook)
  const [prevQty, setPrevQty] = useState(qty);
  const direction = qty > prevQty ? 1 : -1;
  if (prevQty !== qty) setPrevQty(qty);

  if (loading) {
    return <Skeleton className="h-8 w-full md:w-1/2" />;
  }

  const isBusy = loadingAction !== null;

  const handleAdd = async () => {
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size before adding to cart");
      return;
    }

    setLoadingAction("add");
    try {
      await addToCart(productId, productPricing, selectedSize);
      toast.success("Added to cart!");
    } catch (e) {
      console.error(e);
      toast.error("Could not add to cart");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInc = async () => {
    setLoadingAction("inc");
    try {
      const key = isCartPage
        ? productId
        : getCartItemKey(productId, selectedSizeValue);
      await increment(key);
    } catch (e) {
      console.error(e);
      toast.error("Error updating quantity");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDec = async () => {
    setLoadingAction("dec");
    try {
      const key = isCartPage
        ? productId
        : getCartItemKey(productId, selectedSizeValue);
      await decrement(key);
    } catch (e) {
      console.error(e);
      toast.error("Error updating quantity");
    } finally {
      setLoadingAction(null);
    }
  };

  // If qty is zero, show Add button
  if (qty === 0) {
    return (
      <Button
        className={clsx(
          "flex w-full items-center justify-center gap-2",
          isDisabled && "cursor-not-allowed border border-yellow-600",
        )}
        onClick={handleAdd}
        disabled={isBusy || isDisabled}
      >
        {loadingAction === "add" ? (
          <>
            <Loader2Icon className="animate-spin" />
            Adding to Cart...
          </>
        ) : (
          <>
            <PlusSquareIcon /> Add to Cart
          </>
        )}
      </Button>
    );
  }

  // Otherwise show – [qty] +
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <Button
        onClick={handleDec}
        disabled={isBusy}
        className="rounded-none rounded-l-lg px-6 font-semibold"
      >
        –
      </Button>

      <div className="relative h-4 w-full overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.span
            key={qty}
            initial={{ y: direction * 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -direction * 70, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-primary absolute inset-0 flex items-center justify-center text-base font-semibold"
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        onClick={handleInc}
        disabled={isBusy}
        className="rounded-none rounded-r-lg px-6 font-semibold"
      >
        +
      </Button>
    </div>
  );
}
