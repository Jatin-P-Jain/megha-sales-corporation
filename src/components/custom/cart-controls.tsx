"use client";

import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  CheckIcon,
  Loader2Icon,
  PlusSquareIcon,
  TextCursorInput,
  XIcon,
} from "lucide-react";
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
import { Input } from "../ui/input";
import useIsMobile from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();
  const { loading } = useCartState();
  const { increment, decrement, addToCart, setQuantity } = useCartActions();

  const [loadingAction, setLoadingAction] = useState<
    "add" | "inc" | "dec" | "set" | null
  >(null);
  const [showCustomQtyInput, setShowCustomQtyInput] = useState(false);
  const [customQty, setCustomQty] = useState("");

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

  const handleOpenCustomQty = () => {
    setCustomQty(String(qty));
    setShowCustomQtyInput(true);
  };

  const handleCancelCustomQty = () => {
    setShowCustomQtyInput(false);
    setCustomQty("");
  };

  const handleConfirmCustomQty = async () => {
    const parsed = Number(customQty);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please enter a quantity greater than 0");
      return;
    }

    const finalQty = Math.floor(parsed);
    const key = isCartPage
      ? productId
      : getCartItemKey(productId, selectedSizeValue);

    setLoadingAction("set");
    try {
      await setQuantity(key, finalQty);
      setShowCustomQtyInput(false);
      setCustomQty("");
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
    <div
      className={clsx(
        "flex w-full flex-row-reverse items-center justify-center gap-2",
        isCartPage || !isMobile ? "flex-col! items-end! gap-1!" : undefined,
      )}
    >
      <div className="flex w-full items-center justify-center gap-2">
        <Button
          onClick={handleDec}
          disabled={isBusy}
          className="rounded-none rounded-l-lg px-3 font-semibold"
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
          className="rounded-none rounded-r-lg px-3 font-semibold"
        >
          +
        </Button>
      </div>
      {!showCustomQtyInput ? (
        <Button
          variant="link"
          size="sm"
          onClick={handleOpenCustomQty}
          disabled={isBusy}
          className="text-primary w-fit p-0! text-xs"
        >
          <TextCursorInput className="h-4 w-4" /> Custom Quantity
        </Button>
      ) : (
        <div
          className={clsx(
            "flex w-auto items-center gap-1",
            isCartPage && "w-full! justify-between",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelCustomQty}
            disabled={isBusy}
            aria-label="Cancel custom quantity"
            className="bg-red-100 p-0! text-red-700"
          >
            <XIcon className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            className="border-input bg-background min-w-16 flex-1 rounded-md border px-2 text-center text-sm"
            disabled={isBusy}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleConfirmCustomQty}
            disabled={isBusy}
            aria-label="Apply custom quantity"
            className="bg-green-100 text-green-700"
          >
            {loadingAction === "set" ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
