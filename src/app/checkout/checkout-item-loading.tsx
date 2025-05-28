import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutItemLoading() {
  return (
    <li className="flex w-full list-none flex-col gap-4 rounded-lg border p-2 px-4 shadow-md md:p-4 md:px-6">
      <div className="flex flex-col items-start justify-start gap-2">
        <div className="flex w-full items-center justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="size-4 text-red-700 md:size-5" />
        </div>
        <Separator />
      </div>
      <div className="grid grid-cols-[1fr_2fr] items-start justify-start gap-2">
        <div className="flex h-full w-full flex-col items-start justify-between gap-2">
          <Skeleton className="h-24 w-24" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex w-full flex-col items-end gap-1 text-sm">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Separator />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    </li>
  );
}
