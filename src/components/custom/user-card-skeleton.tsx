import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="bg-primary/10 p-2 md:p-3">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {/* Avatar Skeleton */}
            <Skeleton className="h-12 w-12 rounded-full" />

            <div className="flex flex-col gap-2">
              {/* Name Skeleton */}
              <Skeleton className="h-5 w-32" />
              {/* Badge Skeleton */}
              <Skeleton className="h-5 w-20" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="grid w-full grid-cols-2 justify-between gap-2 md:w-auto">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>

      {/* View Details Button Skeleton */}
      <div className="flex cursor-pointer items-center justify-between px-4 py-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
    </Card>
  );
}
