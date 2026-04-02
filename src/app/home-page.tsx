// app/home-page.tsx (SERVER COMPONENT)

import type { Brand } from "@/types/brand";
import BrandsGrid from "./brands-grid";
import HomeUserBar from "./home-user-bar";
// app/brands-grid-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function BrandsGridSkeleton() {
  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      {/* Header row */}
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-4 w-44 md:h-5 md:w-56" />
        <Skeleton className="h-4 w-28 md:h-5 md:w-36" />
      </div>

      {/* Section blocks */}
      {Array.from({ length: 3 }).map((_, sectionIdx) => (
        <div key={sectionIdx} className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 md:w-32" />
            <Skeleton className="h-3 w-40 md:w-56" />
          </div>

          <div className="grid w-full grid-cols-3 items-center gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((__, idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage({
  brandsPromise,
}: {
  brandsPromise: Promise<{ data: Brand[]; totalPages?: number }>;
}) {
  return (
    <>
      <HomeUserBar />

      <Suspense fallback={<BrandsGridSkeleton />}>
        <BrandsGrid brandsPromise={brandsPromise} />
      </Suspense>
    </>
  );
}
