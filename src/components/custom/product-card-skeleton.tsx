"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "../ui/card";

export default function ProductCardSkeleton() {
  
  return (
    <Card className="relative gap-1 overflow-hidden p-4 px-0 shadow-md md:gap-2">
      <CardContent className="flex flex-col gap-4 text-sm md:grid md:grid-cols-[3fr_1fr] md:text-base">
        <div className="flex w-full flex-col md:gap-2">
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Brand :</span>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Name :</span>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Part Number :</span>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="w-full text-sm font-normal">Vehicle Name :</span>
            <div className="flex w-full items-end justify-end">
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="text-primary flex w-full items-center justify-between font-semibold">
            <span className="text-sm font-normal">Category :</span>
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="text-primary mb-1 flex h-full w-full flex-col items-start justify-between gap-1 font-semibold md:mb-2 md:flex-row md:items-center">
            <span className="text-sm font-normal">Select Size:</span>
            <Skeleton className="flex h-6 w-1/4" />
            <Skeleton className="flex h-6 w-1/4" />
            <Skeleton className="flex h-6 w-1/4" />
          </div>
        </div>
        <div className="flex h-27 min-h-27 w-full items-center justify-center md:min-h-30 md:w-full">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-[3fr_1fr] items-end justify-center gap-4">
        <div className="flex w-full flex-col items-start justify-start md:flex-row md:justify-between">
          <div className="text-primary flex items-center gap-2 text-lg font-semibold w-full justify-start">
            <span className="text-foreground text-base font-normal">
              Price :
            </span>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-primary flex items-center gap-2 text-lg font-semibold w-full">
            <span className="text-foreground text-sm font-normal">
              Discount :
            </span>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="text-primary flex items-center gap-2 text-lg font-semibold w-full">
            <span className="text-foreground text-sm font-normal">
              GST :
            </span>
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          <Skeleton className="h-8 w-3/4" />
        </div>
      </CardFooter>
    </Card>
  );
}
