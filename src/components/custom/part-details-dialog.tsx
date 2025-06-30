"use client";

import React from "react";
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
import { Card, CardContent, CardFooter } from "../ui/card";
import ProductImage from "./product-image";
import { formatINR } from "@/lib/utils";

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
  const {
    partNumber,
    image,
    companyName,
    vehicleNames,
    brandName,
    partName,
    partCategory,
    discount,
    price,
    gst,
  } = part?.product || {};
  const {
    price: productPrice = 0,
    discount: productDiscount = 0,
    gst: productGst = 0,
  } = productPricing || {};
  const partPrice = price || productPrice;
  const partDiscount = discount || productDiscount;
  const partGst = gst || productGst;
  const names = Array.isArray(vehicleNames)
    ? part?.product.vehicleNames.join(", ")
    : "";
  const vehicleNameProcessed = names
    ? `${companyName} - ${names}`
    : companyName;
  return (
    <Dialog>
      {/* 1) The trigger is your link-style button */}
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="h-0 min-h-0 w-full p-0 py-1 pb-3 text-xs"
        >
          Part Details
        </Button>
      </DialogTrigger>

      {/* 2) The modal content */}
      <DialogContent className="flex w-[90%] max-w-md flex-col items-center justify-center gap-2 p-2 px-4">
        <DialogHeader>
          <DialogTitle className="flex w-full items-center justify-center text-sm md:text-base">
            Part Details
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Full information for{" "}
            <span className="font-semibold">{partNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <Card
          key={part?.id}
          className="relative w-full gap-2 overflow-hidden p-4 px-0 shadow-md"
        >
          <div className="mx-auto flex h-20 min-h-20 w-20 items-center justify-center">
            <ProductImage productImage={image} />
          </div>
          <CardContent className="flex flex-col gap-2 text-sm md:text-base">
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Brand :</span>
              {brandName}
            </div>
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Part Name :</span>
              <span className="line-clamp-1">{partName}</span>
            </div>
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Part Number :</span>
              {partNumber}
            </div>
            {selectedSize && (
              <div className="text-primary bg-muted flex w-full items-center justify-between font-semibold px-2 rounded-lg">
                <span className="text-sm font-normal">Size :</span>
                {selectedSize}
              </div>
            )}

            <div className="text-primary flex w-full items-start justify-between font-semibold">
              <span className="w-full text-sm font-normal">Vehicle Name :</span>
              <div className="flex w-full items-end justify-end">
                <span className="text-right">{vehicleNameProcessed}</span>
              </div>
            </div>
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Category :</span>{" "}
              {partCategory}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="text-primary flex items-center gap-1 text-lg font-semibold">
              <span className="text-foreground text-sm font-normal md:text-base">
                Price :
              </span>
              {formatINR(partPrice)}
            </div>
            <div className="text-primary flex items-center gap-1 text-sm font-semibold md:text-base">
              <span className="text-foreground text-sm font-normal">
                Discount :
              </span>
              {partDiscount}%
            </div>
            <div className="text-primary flex items-center gap-1 text-sm font-semibold md:text-base">
              <span className="text-foreground font-normal">GST :</span>
              {partGst}%
            </div>
          </CardFooter>
        </Card>

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
