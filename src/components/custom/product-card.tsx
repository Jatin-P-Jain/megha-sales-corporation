"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronsRight, EyeIcon, PencilIcon } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Product, ProductSize, ProductStatus } from "@/types/product";
import ProductImage from "./product-image";
import CartControls from "./cart-controls";
import SizeChips from "./size-selection-chips";
import { Skeleton } from "../ui/skeleton";
import useIsMobile from "@/hooks/useIsMobile";
import UserUnlockDialog from "./user-unlock-dialog";
import { useAuthState } from "@/context/useAuth";
import {
  getCartItemKey,
  useCartItem,
  useCartState,
} from "@/context/cartContext";
import { useUserGate } from "@/context/UserGateProvider";
import { SafeLink } from "./utility/SafeLink";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import clsx from "clsx";

const STATUS_META: Record<
  ProductStatus,
  {
    label: string;
    className: string;
  }
> = {
  draft: {
    label: "Draft",
    className: "border-amber-500 bg-amber-500/10 text-amber-700",
  },
  "for-sale": {
    label: "For sale",
    className: "border-green-500 bg-green-500/10 text-green-700",
  },
  discontinued: {
    label: "Discontinued",
    className: "border-red-500 bg-red-500/10 text-red-700",
  },
  "out-of-stock": {
    label: "Out of stock",
    className: "border-muted bg-muted text-muted-foreground ",
  },
};

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
  const { currentUser } = useAuthState();
  const { profileComplete } = useUserGate();
  const router = useSafeRouter();

  const isUser = !!currentUser;

  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    undefined,
  );
  const [showFullDetails, setShowFullDetails] = useState(false);

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

  const goProfile = useCallback(() => {
    onClose?.();
    router.push("/account/profile");
  }, [onClose, router]);

  const hasLongAdditionalDetails = useMemo(() => {
    if (!product.additionalDetails) return false;
    return (
      product.additionalDetails.length > 90 ||
      product.additionalDetails.split("\n").length > 2
    );
  }, [product.additionalDetails]);

  return (
    <Card
      key={product.id}
      className="relative gap-1 overflow-hidden p-3 shadow-md md:gap-2"
    >
      <CardContent className="flex flex-col gap-4 p-0 text-sm md:grid md:grid-cols-[3fr_1fr] md:text-base">
        <div className="flex w-full flex-col gap-1 md:gap-2">
          <div className="text-primary flex w-full items-center justify-between font-semibold tracking-wide">
            <SafeLink
              href={`/brands/${product.brandId}`}
              className="bg-primary/10 border-primary cursor-pointer gap-2 rounded-md border px-3 py-1 underline"
            >
              <span className="text-muted-foreground mr-2 inline-flex text-xs font-normal">
                Brand:
              </span>
              {product.brandName}
            </SafeLink>
            <span className="bg-primary/10 rounded-md border px-3 py-1">
              <span className="text-muted-foreground mr-2 hidden text-xs font-normal md:inline-flex">
                Part Number:
              </span>
              {product.partNumber}
            </span>
          </div>

          <div className="text-primary flex w-full items-center justify-between font-medium">
            <span className="text-xs font-normal">Part Name :</span>
            <span>{product.partName}</span>
          </div>

          <div className="text-primary flex w-full items-start justify-between font-medium">
            <span className="w-full flex-1 text-xs font-normal whitespace-nowrap">
              Applications :
            </span>
            <span className="fle w-full flex-2 text-right">
              {vehicleNameProcessed}
            </span>
          </div>

          <div className="text-primary flex w-full items-center justify-between font-medium">
            <span className="text-xs font-normal">Category :</span>
            {product.partCategory}
          </div>

          {product.additionalDetails && (
            <div className="text-primary flex w-full items-start justify-between font-medium">
              <span className="text-xs font-normal">Additional Details :</span>
              <div className="flex flex-col items-end gap-1 text-right">
                <span
                  className={clsx(
                    "whitespace-pre-line",
                    !showFullDetails && "max-h-12 overflow-hidden",
                  )}
                >
                  {product.additionalDetails}
                </span>

                {hasLongAdditionalDetails && (
                  <button
                    type="button"
                    onClick={() => setShowFullDetails((prev) => !prev)}
                    className="text-primary text-xs font-semibold underline hover:opacity-80"
                  >
                    {showFullDetails ? "See less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          )}

          {isMobile && (
            <div className="flex gap-3">
              <div className="relative h-32 w-1/2 rounded-sm border shadow-sm">
                <ProductImage productImage={product.image} />
              </div>
              <div className="bg-primary/10 flex h-auto w-1/2 flex-col items-center justify-center gap-1 rounded-sm p-1.5 px-4 md:flex-row">
                <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit">
                  <span className="text-foreground text-xs font-normal">
                    Price :
                  </span>
                  {product.hasSizes &&
                  !product.samePriceForAllSizes &&
                  !selectedSize ? (
                    <span className="text-muted-foreground text-[8px] font-normal whitespace-nowrap italic md:text-xs">
                      Select a size
                    </span>
                  ) : (
                    <span className="text-base font-semibold">
                      {formatINR(selectedSize?.price ?? product.price)}
                    </span>
                  )}
                </div>

                <div className="text-primary flex w-full items-center justify-between font-semibold md:text-sm">
                  <span className="text-foreground text-xs font-normal whitespace-nowrap">
                    Discount :
                  </span>

                  {product.hasSizes &&
                  !product.samePriceForAllSizes &&
                  !selectedSize ? (
                    <span className="text-muted-foreground text-[8px] font-normal whitespace-nowrap italic md:text-xs">
                      Select a size
                    </span>
                  ) : isAccountApproved || isAdmin ? (
                    <span className="font-semibold">
                      {selectedSize?.discount ?? product.discount}%
                    </span>
                  ) : !currentUser ? (
                    <SafeLink
                      href="/login"
                      className="flex cursor-pointer items-center justify-between transition-all hover:opacity-80"
                    >
                      <span className="inline-flex items-center font-semibold text-yellow-600">
                        ***
                      </span>
                      <EyeIcon className="size-5 text-yellow-600" />
                    </SafeLink>
                  ) : (
                    <UserUnlockDialog>
                      <div className="flex cursor-pointer items-center justify-between transition-all hover:opacity-80">
                        <span className="inline-flex items-center font-semibold text-yellow-600">
                          ***
                        </span>
                        <EyeIcon className="size-5 text-yellow-600" />
                      </div>
                    </UserUnlockDialog>
                  )}
                </div>

                <div className="text-primary flex w-full items-center justify-between font-semibold md:w-fit md:text-sm">
                  <span className="text-foreground text-xs font-normal">
                    GST :
                  </span>
                  {product.hasSizes &&
                  !product.samePriceForAllSizes &&
                  !selectedSize ? (
                    <span className="text-muted-foreground text-[8px] font-normal whitespace-nowrap italic md:text-xs">
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
          )}

          {product.sizes && product.sizes?.length > 0 && (
            <div className="text-primary mb-1 flex h-full w-full flex-col justify-between gap-1 font-semibold md:mb-2 md:flex-row">
              <span className="text-xs font-normal md:text-sm">
                Select Size:
              </span>
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
          <div className="relative h-36 w-full rounded-sm border shadow-sm">
            <ProductImage productImage={product.image} />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-end justify-center gap-2 p-0 md:grid md:grid-cols-[3fr_1fr]">
        <div className="flex w-full items-center justify-between gap-2 text-xs">
          {/* <TagIcon className="text-primary size-4" /> */}
          <div className="bg-primary/10 hidden w-full flex-col items-center justify-between gap-1 rounded-sm p-1 px-4 md:flex md:flex-row">
            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit">
              <span className="text-foreground text-xs font-normal">
                Price :
              </span>
              {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal whitespace-nowrap italic md:text-xs">
                  Select a size
                </span>
              ) : (
                <span className="text-lg font-semibold">
                  {formatINR(selectedSize?.price ?? product.price)}
                </span>
              )}
            </div>

            <div className="text-primary flex w-full items-center justify-between font-semibold md:w-fit md:text-sm">
              <span className="text-foreground text-xs font-normal whitespace-nowrap">
                Discount :
              </span>

              {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal whitespace-nowrap italic md:text-xs">
                  Select a size
                </span>
              ) : isAccountApproved || isAdmin ? (
                <span className="font-semibold">
                  {selectedSize?.discount ?? product.discount}%
                </span>
              ) : !currentUser ? (
                <SafeLink
                  href="/login"
                  className="flex cursor-pointer items-center justify-between gap-2 transition-all hover:opacity-80"
                >
                  <span className="inline-flex items-center font-semibold text-yellow-600">
                    *****
                  </span>
                  <EyeIcon className="size-5 text-yellow-600" />
                </SafeLink>
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

            <div className="text-primary flex w-full items-center justify-between font-semibold md:w-fit md:text-sm">
              <span className="text-foreground text-xs font-normal">GST :</span>
              {product.hasSizes &&
              !product.samePriceForAllSizes &&
              !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal whitespace-nowrap italic md:text-xs">
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
              <div
                className={clsx(
                  "inline-flex w-full items-center justify-center rounded-md rounded-b-none border px-2 py-1 text-center text-xs font-medium md:text-sm",
                  STATUS_META[product.status].className,
                )}
              >
                {STATUS_META[product.status].label}
              </div>
              <Button
                variant="outline"
                asChild
                className="text-primary border-primary rounded-t-none"
              >
                <SafeLink
                  href={`/admin-dashboard/edit-product/${product.brandId}/${product.id}`}
                >
                  <PencilIcon />
                  Edit Product
                </SafeLink>
              </Button>
            </div>
          ) : !isUser ? (
            <div className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-yellow-600 bg-yellow-50 p-1 px-2 text-center text-xs whitespace-nowrap text-yellow-600">
              Please{" "}
              <SafeLink
                href="/login"
                className="cursor-pointer font-semibold underline hover:text-yellow-800"
              >
                Login
              </SafeLink>{" "}
              to add products to your cart.
            </div>
          ) : !profileComplete ? (
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
