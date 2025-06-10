"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { formatINR, slugify } from "@/lib/utils";
import { Product, ProductSize } from "@/types/product";
import ProductImage from "./product-image";
import CartControls from "./cart-controls";
import SizeChips from "./size-selection-chips";
import { useCart } from "@/context/cartContext";
import { Skeleton } from "../ui/skeleton";

type ProductCardProps = {
  product: Product;
  isAdmin?: boolean;
};

export default function ProductCard({
  product,
  isAdmin = false,
}: ProductCardProps) {
  const { cart, loading } = useCart();
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    undefined,
  );

  const [hasMounted, setHasMounted] = useState(false);
  // 1) hydration guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 4) debounce the empty-cart state
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cart.length]);

  useEffect(() => {
    if (!product || !product.sizes) return;

    const existingItem = cart.find(
      (item) => item.productId === product.id && item.selectedSize,
    );

    if (existingItem?.selectedSize) {
      const matchedSizeObj = product.sizes.find(
        (size) => size.size === existingItem.selectedSize,
      );

      if (matchedSizeObj) {
        setSelectedSize(matchedSizeObj);
      }
    }
  }, [cart, product]);

  const isLoading = !hasMounted || loading || !ready;

  const vehicleNameProcessed = useMemo(() => {
    const company = product.vehicleCompany;
    const names = Array.isArray(product.vehicleNames)
      ? product.vehicleNames.join(", ")
      : "";
    const vehicleNameProcessed = names ? `${company} - ${names}` : company;
    return vehicleNameProcessed;
  }, [product.vehicleNames]);

  return (
    <Card
      key={product?.id}
      className="relative gap-0 overflow-hidden p-4 px-0 shadow-md"
    >
      <CardContent className="flex text-sm md:grid md:grid-cols-[3fr_1fr] md:text-base">
        <div className="flex w-full flex-col md:gap-2">
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Brand :</span>
            {product.brandName}
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Name :</span>
            <span className="line-clamp-1">{product.partName}</span>
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Number :</span>
            {product.partNumber}
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="w-full text-sm font-normal">Vehicle Name :</span>
            <div className="flex w-full items-end justify-end">
              <span className="line-clamp-1">{vehicleNameProcessed}</span>
            </div>
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Category :</span>
            {product.partCategory}
          </div>
          <div className="flex min-h-27 w-full items-center justify-center md:min-h-30 md:w-full">
            <ProductImage productImage={product?.image} />
          </div>
          {product.sizes && product.sizes.length > 0 && (
            <div className="text-primary mb-1 flex h-full w-full flex-col items-start justify-between gap-1 font-semibold md:mb-2 md:flex-row md:items-center">
              <span className="text-sm font-normal">Select Size:</span>
              {isLoading ? (
                <Skeleton className="flex h-6 w-full" />
              ) : (
                <SizeChips
                  productId={
                    !!selectedSize ? product.id + selectedSize.size : product.id
                  }
                  sizes={product.sizes}
                  onSelectSize={(selected) => setSelectedSize(selected)}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-[3fr_1fr] items-end justify-center gap-0">
        <div className="flex w-full flex-col items-start justify-start md:flex-row md:justify-between">
          <div className="text-primary flex items-center gap-2 text-lg font-semibold">
            <span className="text-foreground text-base font-normal">
              Price :
            </span>
            {product?.hasSizes &&
            !product.samePriceForAllSizes &&
            !selectedSize ? (
              <span className="text-muted-foreground text-[10px] font-normal italic">
                Select a size
              </span>
            ) : (
              <span className="font-semibold">
                {formatINR(selectedSize?.price ?? product?.price)}
              </span>
            )}
          </div>
          <div className="text-primary flex items-center gap-2 text-sm font-semibold">
            <span className="text-foreground text-sm font-normal">
              Discount :
            </span>
            {product?.hasSizes &&
            !product.samePriceForAllSizes &&
            !selectedSize ? (
              <span className="text-muted-foreground text-[10px] font-normal italic">
                Select a size
              </span>
            ) : (
              <span className="font-semibold">
                {selectedSize?.discount ?? product?.discount}%
              </span>
            )}
          </div>
          <div className="text-primary flex items-center gap-2 text-sm font-semibold">
            <span className="text-foreground font-normal">GST :</span>
            {product?.hasSizes &&
            !product.samePriceForAllSizes &&
            !selectedSize ? (
              <span className="text-muted-foreground text-[10px] font-normal italic">
                Select a size
              </span>
            ) : (
              <span className="font-semibold">
                {selectedSize?.gst ?? product?.gst}%
              </span>
            )}
          </div>
          {product.hasSizes &&
            !product?.samePriceForAllSizes &&
            !selectedSize && (
              <span className="text-muted-foreground text-[10px] italic">
                Pricing varies by size.
              </span>
            )}
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          {isAdmin ? (
            <div className="flex w-full flex-col">
              <div
                className={`${
                  product.status === "draft"
                    ? "border-amber-100 bg-amber-100 text-yellow-600"
                    : product.status === "for-sale"
                      ? "border-green-100 bg-green-100 text-green-700"
                      : product.status === "out-of-stock"
                        ? "border-zinc-100 bg-zinc-100 text-zinc-800"
                        : product.status === "discontinued"
                          ? "border-red-100 bg-red-100 text-red-600"
                          : ""
                } py-1font-semibold flex w-full items-center justify-center gap-1 rounded-t-lg border-1 px-1 pt-1 text-xs font-semibold`}
              >
                {product.status === "draft"
                  ? "DRAFT"
                  : product.status === "for-sale"
                    ? "FOR SALE"
                    : product.status === "out-of-stock"
                      ? "OUT OF STOCK"
                      : product.status === "discontinued"
                        ? "DISCONTINUED"
                        : ""}
              </div>
              <Button
                variant={"outline"}
                asChild
                className={`${
                  product.status === "draft"
                    ? "border-amber-100"
                    : product.status === "for-sale"
                      ? "border-green-100"
                      : product.status === "out-of-stock"
                        ? "border-zinc-100"
                        : product.status === "discontinued"
                          ? "border-red-100"
                          : ""
                } rounded-t-none`}
              >
                <Link
                  href={`/admin-dashboard/edit-product/${slugify(product?.brandName)}/${product?.id}`}
                >
                  <PencilIcon />
                  Edit Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-end">
              <CartControls
                productId={product?.id}
                selectedSize={product.hasSizes ? selectedSize?.size : ""}
                hasSizes={product.hasSizes}
                productPricing={{
                  price: selectedSize?.price ?? product.price,
                  discount: selectedSize?.discount ?? product?.discount,
                  gst: selectedSize?.gst ?? product?.gst,
                }}
              />
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
