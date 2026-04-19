"use client";

import React, { useMemo } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CartProduct } from "@/types/cartProduct";
import ProductCard from "./product-card";
import { Product } from "@/types/product";

interface PartDetailsDialogProps {
  part: CartProduct;
  productPricing?: {
    price?: number;
    discount?: number;
    gst?: number;
  };
  selectedSize?: string;
}

export function PartDetailsDialog({
  part,
  productPricing,
  selectedSize,
}: PartDetailsDialogProps) {
  const { partNumber, companyName, discount, price, gst } = part?.product || {};
  const {
    price: productPrice = 0,
    discount: productDiscount = 0,
    gst: productGst = 0,
  } = productPricing || {};
  const partPrice = price || productPrice;
  const partDiscount = discount || productDiscount;
  const partGst = gst || productGst;
  const productForDialog = useMemo<Product>(
    () => ({
      ...part.product,
      id: part.product?.id || part.id,
      companyName: part.product?.companyName || "",
      vehicleCompany: part.product?.vehicleCompany || companyName || "",
      vehicleNames: Array.isArray(part.product?.vehicleNames)
        ? part.product.vehicleNames
        : [],
      partCategory: part.product?.partCategory || "",
      partNumber: part.product?.partNumber || "",
      partName: part.product?.partName || "",
      brandName: part.product?.brandName || "",
      brandId: part.product?.brandId || "",
      status: part.product?.status || "for-sale",
      image: part.product?.image,
      price: partPrice,
      discount: partDiscount,
      gst: partGst,
    }),
    [companyName, part.id, part.product, partDiscount, partGst, partPrice],
  );

  return (
    <Dialog>
      {/* 1) The trigger is your link-style button */}
      <DialogTrigger asChild>
        <Button variant="link" className="px-0! text-xs underline">
          Part Details
        </Button>
      </DialogTrigger>

      {/* 2) The modal content */}
      <DialogContent className="max-h-[85dvh] w-[95%] max-w-4xl overflow-y-auto p-3 md:p-4">
        <DialogHeader>
          <DialogTitle className="flex w-full items-center justify-center text-sm md:text-base">
            Part Details
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Full information for{" "}
            <span className="font-semibold">{partNumber}</span>
          </DialogDescription>
        </DialogHeader>

        {selectedSize && (
          <div className="text-primary bg-muted mb-2 flex w-full items-center justify-between rounded-lg px-3 py-1 text-xs font-semibold md:text-sm">
            <span>Selected Size</span>
            <span>{selectedSize}</span>
          </div>
        )}

        <ProductCard product={productForDialog} />

        <DialogFooter className="flex w-full items-center justify-center gap-2 py-2">
          {/* 3) The close button */}
          <DialogClose asChild>
            <Button className="mx-auto flex w-1/2">Ok</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
