"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EyeIcon, PencilIcon, TagIcon } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Product, ProductSize } from "@/types/product";
import ProductImage from "./product-image";
import CartControls from "./cart-controls";
import SizeChips from "./size-selection-chips";
import { useCart } from "@/context/cartContext";
import { Skeleton } from "../ui/skeleton";
import useIsMobile from "@/hooks/useIsMobile";
import ApprovalRequestDialog from "./approval-request-dialog";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";

type ProductCardProps = {
  product: Product;
  isAdmin?: boolean;
  isAccountApproved?: boolean;
  isUser?: boolean;
};

export default function ProductCard({
  product,
  isAdmin = false,
  isAccountApproved = false,
  isUser = false,
}: ProductCardProps) {
  const { cart, loading } = useCart();
  const auth = useAuth();
  const router = useRouter();
  const { clientUser, currentUser } = auth;
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    undefined,
  );
  const isMobile = useIsMobile();

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
  }, [product.vehicleNames, product.vehicleCompany]);

  // Handle discount view click
  const handleDiscountClick = () => {
    if (!clientUser) {
      router.push("/login");
    }
  };

  return (
    <Card
      key={product?.id}
      className="relative gap-1 overflow-hidden p-3 shadow-md md:gap-2"
    >
      <CardContent className="flex flex-col gap-4 text-sm md:grid md:grid-cols-[3fr_1fr] md:text-base p-0">
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
            <span className="">{product.partName}</span>
          </div>

          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Number :</span>
            {product.partNumber}
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="w-full text-sm font-normal">Applications :</span>
            <div className="flex w-full items-end justify-end">
              <span className="">{vehicleNameProcessed}</span>
            </div>
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Category :</span>
            {product.partCategory}
          </div>
          {product?.additionalDetails && (
            <div className="text-primary flex w-full items-start justify-between font-semibold">
              <span className="text-sm font-normal">Additional Details :</span>
              <span className="text-right whitespace-pre-line">
                {product.additionalDetails}
              </span>
            </div>
          )}
          {isMobile && (
            <div className="flex h-27 min-h-27 w-full items-center justify-center md:min-h-30 md:w-full">
              <ProductImage productImage={product?.image} />
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="text-primary mb-1 flex h-full w-full flex-col justify-between gap-1 font-semibold md:mb-2 md:flex-row">
              <span className="text-sm font-normal">Select Size:</span>
              {isLoading ? (
                <Skeleton className="flex h-6 w-full" />
              ) : (
                <div className="md:max-w-150">
                  <SizeChips
                    productId={
                      !!selectedSize
                        ? product.id + selectedSize.size
                        : product.id
                    }
                    sizes={product.sizes}
                    onSelectSize={(selected) => setSelectedSize(selected)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {!isMobile && (
          <div className="flex h-27 min-h-27 w-full items-center justify-center md:min-h-30 md:w-full">
            <ProductImage productImage={product?.image} />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col md:grid md:grid-cols-[3fr_1fr] items-end justify-center gap-4 p-0">
        <div className="bg-primary/10 flex items-center justify-between gap-2 rounded-sm p-1 px-2 text-xs w-full md:flex-row md:items-center md:justify-between md:px-8 md:text-base">
          <TagIcon className="text-primary size-4" />
          <div className="flex w-full flex-col items-center justify-between md:flex-row">
            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit">
              <span className="text-foreground font-normal">Price :</span>
              {product?.hasSizes &&
                !product.samePriceForAllSizes &&
                !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal italic md:text-xs">
                  Select a size
                </span>
              ) : (
                <span className="font-semibold">
                  {formatINR(selectedSize?.price ?? product?.price)}
                </span>
              )}
            </div>
            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit md:text-sm">
              <span className="text-foreground font-normal">Discount :</span>
              {product?.hasSizes &&
                !product.samePriceForAllSizes &&
                !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal italic md:text-xs">
                  Select a size
                </span>
              ) : isAccountApproved ? (
                <span className="font-semibold">
                  {selectedSize?.discount ?? product?.discount}%
                </span>
              ) : !currentUser ? (
                // Not logged in - redirect to login
                <div
                  onClick={handleDiscountClick}
                  className="flex cursor-pointer items-center justify-between gap-2 transition-all hover:opacity-80"
                >
                  <span className="inline-flex items-center font-semibold text-yellow-600">
                    *****
                  </span>
                  <EyeIcon className="size-5 text-yellow-600" />
                </div>
              ) : (
                // Logged in but not approved - show approval dialog
                <ApprovalRequestDialog>
                  <div className="flex cursor-pointer items-center justify-between gap-2 transition-all hover:opacity-80">
                    <span className="inline-flex items-center font-semibold text-yellow-600">
                      *****
                    </span>
                    <EyeIcon className="size-5 text-yellow-600" />
                  </div>
                </ApprovalRequestDialog>
              )}
            </div>
            <div className="text-primary flex w-full items-center justify-between gap-2 font-semibold md:w-fit md:text-sm">
              <span className="text-foreground font-normal">GST :</span>
              {product?.hasSizes &&
                !product.samePriceForAllSizes &&
                !selectedSize ? (
                <span className="text-muted-foreground text-[8px] font-normal italic md:text-xs">
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
                className={`${product.status === "draft"
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
                <span className="text-muted-foreground text-xs font-normal">
                  Status :{" "}
                </span>
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
                className={`${product.status === "draft"
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
                  href={`/admin-dashboard/edit-product/${product?.brandId}/${product?.id}`}
                >
                  <PencilIcon />
                  Edit Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col w-full items-center justify-end">
              {isUser && !isAccountApproved && <div
                className="bg-yellow-50 px-2"
              >
                <span className="text-yellow-700 text-xs">
                  Account Approval Pending
                </span>
              </div>}
              <CartControls
                isDisabled={!isAccountApproved && isUser}
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
