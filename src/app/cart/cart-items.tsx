"use client";

import React from "react";
import CartControls from "@/components/custom/cart-controls";
import currencyFormatter from "@/lib/currency-formatter";
import { Separator } from "@/components/ui/separator";
import {
  EyeIcon,
  ImageOffIcon,
  PackagePlus,
  ShoppingCart,
  TriangleAlert,
  XCircleIcon,
} from "lucide-react";
import { PartDetailsDialog } from "@/components/custom/part-details-dialog";
import UserUnlockDialog from "@/components/custom/user-unlock-dialog";
import CartItemLoading from "./cart-item-loading";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { useCartActions, useCartState } from "@/context/cartContext";
import { SafeLink } from "@/components/custom/utility/SafeLink";
import { useUserGate } from "@/context/UserGateProvider";
import { Card } from "@/components/ui/card";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import clsx from "clsx";

export function CartItems() {
  const { cartProducts, loading } = useCartState();
  const { removeFromCart } = useCartActions();
  const { profileComplete, accountStatus } = useUserGate();
  const isAccountApproved = accountStatus === "approved";
  const canSeeDiscounts = profileComplete && isAccountApproved;
  const checkoutDisabledReason = !profileComplete ? (
    <>
      <SafeLink
        href="/account/profile?redirect=/cart"
        className="font-semibold underline"
      >
        Complete your profile
      </SafeLink>{" "}
      to proceed to checkout.
    </>
  ) : !isAccountApproved ? (
    "Your account is pending approval."
  ) : null;

  const isEmpty = !loading && cartProducts.length === 0;

  if (loading) return <CartItemLoading />;

  if (isEmpty) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <div className="flex w-full flex-col justify-center gap-2">
          <h2 className="flex items-center justify-center gap-2 text-center text-sm font-medium md:text-base">
            <ShoppingCart
              fill="#000"
              fillOpacity={0.2}
              className="inline-flex size-5 self-center"
            />
            Cart Empty!
          </h2>
          <p className="text-muted-foreground text-center text-xs md:text-sm">
            Your cart does not have any products right now.<br></br> Start adding
            products to place an order.
          </p>
        </div>
        <Button asChild>
          <SafeLink href="/products-list">
            <PackagePlus className="size-4" /> Add products
          </SafeLink>
        </Button>
      </div>
    );
  }

  return (
    <>
      {checkoutDisabledReason && (
        <div className="bg-muted fixed inset-x-0 top-42 z-20 mx-auto w-full max-w-5xl px-4 py-2 pt-3 text-xs text-yellow-600 md:top-50">
          <TriangleAlert className="mr-2 inline-block size-3" />{" "}
          {checkoutDisabledReason}
        </div>
      )}

      <ul
        className={clsx(
          "mx-auto flex h-full flex-1 flex-col gap-4 pb-4",
          checkoutDisabledReason && "pt-4",
        )}
      >
        {cartProducts.map((item) => {
          const {
            price = 0,
            discount = 0,
            gst = 0,
          } = item.productPricing ?? {};
          const qty = item.quantity;
          const productImage =
            item.productImage ?? item.product?.image ?? undefined;

          // compute pricing (memo not needed; per row only)
          const unitDiscount = Math.round((discount / 100) * price);
          const unitPriceAfterDiscount = Math.round(price - unitDiscount);
          const unitGST = Math.round((gst / 100) * unitPriceAfterDiscount);
          const unitNetPrice = Math.round(unitPriceAfterDiscount + unitGST);
          const totalPrice = Math.round(unitNetPrice * qty);

          return (
            <Card
              key={item.cartItemKey}
              className="grid grid-cols-1 gap-2 rounded-lg border p-2 px-4 shadow-md"
            >
              <div className="flex flex-col items-start justify-start gap-1">
                <div className="flex w-full items-center justify-between gap-2">
                  <h3 className="line-clamp-1 flex w-full flex-row gap-2 text-sm font-semibold md:text-base">
                    {item.product.partNumber}{" "}
                    {item.selectedSize && <span>({item.selectedSize})</span>}
                  </h3>

                  <button
                    type="button"
                    className="bg-muted rounded-sm p-1"
                    onClick={() => removeFromCart(item.cartItemKey)}
                  >
                    <XCircleIcon className="size-4 text-red-700 md:size-5" />
                  </button>
                </div>
                <Separator />
              </div>

              <div className="flex flex-col items-start justify-start gap-1">
                <div className="flex w-full items-center justify-start gap-2">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white shadow-sm">
                    {productImage ? (
                      <Image
                        src={imageUrlFormatter(productImage)}
                        alt={item?.product?.partName ?? "Product image"}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center text-[10px]">
                        <ImageOffIcon className="h-4 w-4" />
                        <small>No Image</small>
                      </div>
                    )}
                  </div>
                  <div className="flex h-full min-w-0 flex-1 flex-col items-start justify-center">
                    <h3 className="w-full truncate text-sm font-medium md:text-base">
                      {item.product.partName || "Product Name"}
                    </h3>

                    <PartDetailsDialog
                      part={item}
                      selectedSize={item.selectedSize}
                      productPricing={item.productPricing}
                    />
                  </div>
                  <div className="ml-auto flex h-full w-auto shrink-0 items-end justify-end md:w-1/4">
                    <CartControls
                      isCartPage
                      productId={item.cartItemKey}
                      productPricing={{}}
                    />
                  </div>
                </div>

                <div className="flex w-full flex-col items-end gap-1 text-sm md:text-base">
                  <div className="flex w-full items-center justify-between text-xs font-semibold md:text-sm">
                    Total Units :{" "}
                    <span className="text-sm font-medium md:text-base">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="flex w-full flex-col items-start justify-start gap-1 rounded-lg border p-1 px-2">
                    <div className="flex w-full items-center justify-between gap-2 text-[10px] md:text-sm">
                      <span>Per Unit</span>
                      <span>Value</span>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2 text-xs md:text-sm">
                      <span>Price :</span>
                      <span className="text-sm font-semibold md:text-base">
                        {currencyFormatter(item.productPricing?.price ?? 0)}
                      </span>
                    </div>

                    {canSeeDiscounts ? (
                      <>
                        <div className="flex w-full items-center justify-between text-xs md:text-sm">
                          Discount ({item.productPricing?.discount} %) :
                          <span className="text-sm font-semibold md:text-base">
                            <span className="text-muted-foreground text-xs font-normal">
                              (-){" "}
                            </span>
                            {currencyFormatter(unitDiscount)}
                          </span>
                        </div>

                        <div className="flex w-full items-center justify-between text-xs md:text-sm">
                          GST ({item.productPricing?.gst} %) :
                          <span className="text-sm font-semibold md:text-base">
                            <span className="text-muted-foreground text-xs font-normal">
                              (+){" "}
                            </span>
                            {currencyFormatter(unitGST)}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex w-full items-center justify-between text-xs md:text-sm">
                          Net Amount :{" "}
                          <span className="text-sm font-semibold md:text-base">
                            {currencyFormatter(unitNetPrice)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Separator />
                        <div className="flex w-full items-center justify-between text-xs md:text-sm">
                          <span>Discounts &amp; GST :</span>
                          <UserUnlockDialog>
                            <div className="flex cursor-pointer items-center gap-1 transition-all hover:opacity-80">
                              <span className="font-semibold text-yellow-600">
                                ***
                              </span>
                              <EyeIcon className="size-4 text-yellow-600" />
                            </div>
                          </UserUnlockDialog>
                        </div>
                      </>
                    )}
                  </div>

                  {canSeeDiscounts && (
                    <div className="flex w-full items-center justify-between text-xs font-semibold md:text-sm">
                      Total Amount :{" "}
                      <span className="text-primary text-base md:text-lg">
                        {currencyFormatter(totalPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
