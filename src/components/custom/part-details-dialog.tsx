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
}

export function PartDetailsDialog({ part }: PartDetailsDialogProps) {
  const company = part.vehicleCompany;
  const names = Array.isArray(part.vehicleName)
    ? part.vehicleName.join(", ")
    : "";
  const vehicleNameProcessed = names ? `${company} - ${names}` : company;
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
            <span className="font-semibold">{part.partNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <Card
          key={part?.id}
          className="relative w-full gap-2 overflow-hidden p-4 px-0 shadow-md"
        >
          <div className="mx-auto flex h-20 min-h-20 w-20 items-center justify-center">
            <ProductImage productImage={part?.image} />
          </div>
          <CardContent className="flex flex-col text-sm md:text-base gap-2">
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Brand :</span>
              {part.brandName}
            </div>
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Part Name :</span>
              <span className="line-clamp-1">{part.partName}</span>
            </div>
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Part Number :</span>
              {part.partNumber}
            </div>

            <div className="text-primary flex w-full items-start justify-between font-semibold">
              <span className="w-full text-sm font-normal">Vehicle Name :</span>
              <div className="flex w-full items-end justify-end">
                <span className="text-right">{vehicleNameProcessed}</span>
              </div>
            </div>
            <div className="text-primary flex w-full items-center justify-between font-semibold">
              <span className="text-sm font-normal">Category :</span>{" "}
              {part.partCategory}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="text-primary flex items-center gap-1 text-lg font-semibold">
              <span className="text-foreground text-sm md:text-base font-normal">
                Price :
              </span>
              {formatINR(part?.price)}
            </div>
            <div className="text-primary flex items-center gap-1 text-sm md:text-base font-semibold">
              <span className="text-foreground text-sm font-normal">
                Discount :
              </span>
              {part?.discount}%
            </div>
            <div className="text-primary flex items-center gap-1 text-sm md:text-base font-semibold">
              <span className="text-foreground font-normal">GST :</span>
              {part?.gst}%
            </div>
          </CardFooter>
        </Card>

        {/* <div className="flex w-full flex-col items-start justify-start gap-1 text-xs md:text-sm">
          <div>
            <span className="font-semibold">ID:</span> {part.id}
          </div>
          <div>
            <span className="font-semibold">Name:</span> {part.partName}
          </div>
          <div>
            <span className="font-semibold">Price:</span> ₹{part.price}
          </div>
          {part.discount != null && (
            <div>
              <span className="font-semibold">Discount:</span> {part.discount}%
            </div>
          )}
          {part.gst != null && (
            <div>
              <span className="font-semibold">GST:</span> {part.gst}%
            </div>
          )}
        </div> */}

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
