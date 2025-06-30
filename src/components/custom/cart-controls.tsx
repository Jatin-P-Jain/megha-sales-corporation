"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Loader2Icon, PlusSquareIcon } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/cartContext";
import { Skeleton } from "../ui/skeleton";

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
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default function CartControls({
  productId,
  productPricing,
  selectedSize,
  hasSizes,
  isCartPage = false,
}: Props) {
  const { currentUser } = useAuth();
  const { cart, increment, decrement, addToCart, loading } = useCart();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<
    "add" | "inc" | "dec" | null
  >(null);

  const [hasMounted, setHasMounted] = useState(false);
  const [ready, setReady] = useState(false);
  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 4) debounce the empty-cart state
  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cart.length]);

  // find current qty
  const item = isCartPage
    ? cart.find((i) => {
        return i.cartItemKey === productId;
      })
    : cart.find((i) => {
        if (hasSizes && selectedSize)
          return i.productId === productId && i.selectedSize === selectedSize;
        else return i.productId === productId;
      });

  const qty = item?.quantity ?? 0;
  const selectedSizeValue = item?.selectedSize ?? selectedSize ?? "";

  // remember previous qty for animation direction
  const prevQty = usePrevious(qty);
  const direction = qty > (prevQty ?? qty) ? 1 : -1;

  const isLoading = !hasMounted || loading || !ready;

  const handleAdd = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
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
        : productId +
          (selectedSizeValue
            ? "_" + selectedSizeValue.replaceAll(" ", "")
            : "");
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
        : productId +
          (selectedSizeValue
            ? "_" + selectedSizeValue.replaceAll(" ", "")
            : "");
      await decrement(key);
    } catch (e) {
      console.error(e);
      toast.error("Error updating quantity");
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-8 w-full md:w-1/2" />;
  }

  // If the user just clicked +/– or add, we could disable controls briefly
  const isBusy = loadingAction !== null;

  // 1) If qty is zero, show Add button
  if (qty === 0) {
    return (
      <Button
        className="flex w-full items-center justify-center gap-2 md:w-3/4"
        onClick={handleAdd}
        disabled={isBusy}
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

  // 2) Otherwise show – [qty] + with animated qty
  return (
    <div className="flex w-full items-center justify-center gap-2 md:w-3/4">
      <Button
        onClick={handleDec}
        disabled={isBusy}
        className="rounded-none rounded-l-lg px-3"
      >
        –
      </Button>
      <div className="relative h-4 w-8 overflow-hidden md:w-16">
        <AnimatePresence initial={false}>
          <motion.span
            key={qty}
            initial={{ y: direction * 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -direction * 70, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center text-sm"
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        onClick={handleInc}
        disabled={isBusy}
        className="rounded-none rounded-r-lg px-3"
      >
        +
      </Button>
    </div>
  );
}
