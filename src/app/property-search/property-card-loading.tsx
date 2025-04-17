import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyCardLoading() {
  return (
    <Card className="p-0 overflow-hidden relative">
      <CardContent className="p-0 ">
        <div className="h-55 relative bg-sky-100 flex flex-col items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex flex-col p-5.5 gap-5">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[50%]" />
          </div>
          <div className="flex flex-row gap-6 ">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="text-lg font-medium">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex w-full items-center justify-center ">
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
