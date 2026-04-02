import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card className="mx-auto w-full max-w-screen-lg p-2 py-4 md:p-4 md:py-6">
      <CardHeader className="p-0">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-7 w-40" /> {/* title */}
          <Skeleton className="h-28 w-28 rounded-full" /> {/* avatar */}
          <Skeleton className="h-4 w-64" /> {/* uid label */}
          <Skeleton className="h-5 w-44" /> {/* uid value */}
        </div>
      </CardHeader>

      <CardContent className="mt-6 flex flex-col gap-4 p-0">
        <Skeleton className="h-10 w-full rounded-md" /> {/* role banner */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
        <Skeleton className="h-28 w-full rounded-md" />{" "}
        {/* firebase methods card area */}
        <Skeleton className="h-12 w-full rounded-md" />{" "}
        {/* collapsible trigger */}
      </CardContent>
    </Card>
  );
}
