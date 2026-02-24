"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronsRight, EyeIcon, PencilIcon, TagIcon } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Product, ProductSize } from "@/types/product";
import ProductImage from "./product-image";
import CartControls from "./cart-controls";
import SizeChips from "./size-selection-chips";
import { Skeleton } from "../ui/skeleton";
import useIsMobile from "@/hooks/useIsMobile";
import UserUnlockDialog from "./user-unlock-dialog";
import { useAuthState } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import {
  getCartItemKey,
  useCartItem,
  useCartState,
} from "@/context/cartContext";

type ProductCardProps = {
  product: Product;
  isAdmin?: boolean;
  isAccountApproved?: boolean;
  onClose?: () => void;
};

export default function ProductCard({
  product,
  isAdmin = false,
  isAccountApproved = false,
  onClose,
}: ProductCardProps) {
  const { loading: cartLoading } = useCartState();
  const { clientUser, currentUser } = useAuthState();
  const router = useRouter();

  const isUser = !!currentUser;
  const isProfileComplete = !!clientUser?.profileComplete;

  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    undefined,
  );

  const isMobile = useIsMobile();
  const isLoading = cartLoading;

  const vehicleNameProcessed = useMemo(() => {
    const company = product.vehicleCompany;
    const names = Array.isArray(product.vehicleNames)
      ? product.vehicleNames.join(", ")
      : "";
    return names ? `${company} - ${names}` : company;
  }, [product.vehicleNames, product.vehicleCompany]);

  // ✅ Subscribe only to the relevant cart item (key changes with size)
  const cartItemKey = useMemo(
    () => getCartItemKey(product.id, selectedSize?.size),
    [product.id, selectedSize?.size],
  );
  const cartItem = useCartItem(cartItemKey);

  // ✅ If there is a cartItem for this exact key, ensure selectedSize is set
  // (useful when list loads and user already has an item in cart)
  useEffect(() => {
    if (!product?.sizes?.length) return;

    // If selectedSize already chosen, don't override it
    if (selectedSize) return;

    // If cart item exists and has selectedSize, pick it
    const cartSel = cartItem?.selectedSize;
    if (!cartSel) return;

    const matched = product.sizes.find((s) => s.size === cartSel);
    if (matched) setSelectedSize(matched);
  }, [cartItem?.selectedSize, product.sizes, selectedSize]);

  const goLogin = useCallback(() => {
    onClose?.();
    router.push("/login");
  }, [onClose, router]);

  const goProfile = useCallback(() => {
    onClose?.();
    router.push("/account/profile");
  }, [onClose, router]);

  return (
    <Card
      key={product.id}
      className="relative gap-1 overflow-hidden p-3 shadow-md md:gap-2"
    >
      <CardContent className="flex flex-col gap-4 p-0 text-sm md:grid md:grid-cols-[3fr_1fr] md:text-base">
        <div className="flex w-full flex-col md:gap-2">
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Brand :</span>
            <Link
              href={`/brands/${product.brandId}`}
              className="cursor-pointer underline"
            >
              {product.brandName}
            </Link>
          </div>

          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Name :</span>
            <span>{product.partName}</span>
          </div>

          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Number :</span>
            {product.partNumber}
          </div>

          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="w-full text-sm font-normal">Applications :</span>
            <div className="flex w-full items-end justify-end">
              <span>{vehicleNameProcessed}</span>
            </div>
          </div>

          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Category :</span>
            {product.partCategory}
          </div>

          {product.additionalDetails && (
            <div className="text-primary flex w-full items-start justify-between font-semibold">
              <span className="text-sm font-normal">Additional Details :</span>
              <span className="text-right whitespace-pre-line">
                {product.additionalDetails}
              </span>
            </div>
          )}

          {isMobile && (
            <div className="flex h-27 min-h-27 w-full items-center justify-center md:min-h-30 md:w-full">
              <ProductImage productImage={product.image} />
            </div>
          )}

          {product.sizes && product.sizes?.length > 0 && (
            <div className="text-primary mb-1 flex h-full w-full flex-col justify-between gap-1 font-semibold md:mb-2 md:flex-row">
              <span className="text-sm font-normal">Select Size:</span>
              {isLoading ? (
                <Skeleton className="flex h-6 w-full" />
              ) : (
                <div className="md:max-w-150">
                  <SizeChips
                    productId={
                      selectedSize ? product.id + selectedSize.size : product.id
                    }
                    sizes={product.sizes}
                    onSelectSize={setSelectedSize}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="flex h-27 min-h-27 w-full items-center justify-center md:min-h-30 md:w-full">
            <ProductImage productImage={product.image} />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-end justify-center gap-4 p-0 md:grid md:grid-cols-[3fr_1fr]">
        <div className="bg-primary/10 flex w-full items-center justify-between gap-2 rounded-sm p-1 px-2 text-xs md:flex-row md:items-center md:justify-between md:px-8 md:text-base">
          <TagIcon className="text-primary size-4" />
          <div className="flex w-full flex-col items-center justify-between md:flex-row">
            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit">
              <span className="text-foreground font-normal">Price :</span>
              {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal italic md:text-xs">
                  Select a size
                </span>
              ) : (
                <span className="font-semibold">
                  {formatINR(selectedSize?.price ?? product.price)}
                </span>
              )}
            </div>

            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit md:text-sm">
              <span className="text-foreground font-normal">Discount :</span>

              {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal italic md:text-xs">
                  Select a size
                </span>
              ) : isAccountApproved ? (
                <span className="font-semibold">
                  {selectedSize?.discount ?? product.discount}%
                </span>
              ) : !currentUser ? (
                <div
                  onClick={goLogin}
                  className="flex cursor-pointer items-center justify-between gap-2 transition-all hover:opacity-80"
                >
                  <span className="inline-flex items-center font-semibold text-yellow-600">
                    *****
                  </span>
                  <EyeIcon className="size-5 text-yellow-600" />
                </div>
              ) : (
                <UserUnlockDialog>
                  <div className="flex cursor-pointer items-center justify-between gap-2 transition-all hover:opacity-80">
                    <span className="inline-flex items-center font-semibold text-yellow-600">
                      *****
                    </span>
                    <EyeIcon className="size-5 text-yellow-600" />
                  </div>
                </UserUnlockDialog>
              )}
            </div>

            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit md:text-sm">
              <span className="text-foreground font-normal">GST :</span>
              {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal italic md:text-xs">
                  Select a size
                </span>
              ) : (
                <span className="font-semibold">
                  {selectedSize?.gst ?? product.gst}%
                </span>
              )}
            </div>

            {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize && (
                <span className="text-muted-foreground text-[8px] italic md:text-xs">
                  Pricing varies by size.
                </span>
              )}
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2">
          {isAdmin ? (
            <div className="flex w-full flex-col">
              {/* unchanged admin UI */}
              <Button variant="outline" asChild className="rounded-t-none">
                <Link
                  href={`/admin-dashboard/edit-product/${product.brandId}/${product.id}`}
                >
                  <PencilIcon />
                  Edit Product
                </Link>
              </Button>
            </div>
          ) : !isUser ? (
            <div className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-yellow-600 bg-yellow-50 p-1 px-2 text-center text-xs whitespace-nowrap text-yellow-600">
              Please{" "}
              <button
                type="button"
                className="cursor-pointer font-semibold underline hover:text-yellow-800"
                onClick={goLogin}
              >
                Login
              </button>{" "}
              to add products to your cart.
            </div>
          ) : !isProfileComplete ? (
            <Button
              onClick={goProfile}
              className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-yellow-600 bg-yellow-50 text-center text-xs text-yellow-600 md:w-fit"
            >
              {"Complete Your Profile Now"} <ChevronsRight className="size-4" />
            </Button>
          ) : (
            <div className="flex w-full flex-col items-center justify-end">
              <CartControls
                isDisabled={!isAccountApproved && isUser}
                productId={product.id}
                selectedSize={product.hasSizes ? selectedSize?.size : ""}
                hasSizes={product.hasSizes}
                productPricing={{
                  price: selectedSize?.price ?? product.price,
                  discount: selectedSize?.discount ?? product.discount,
                  gst: selectedSize?.gst ?? product.gst,
                }}
              />
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
