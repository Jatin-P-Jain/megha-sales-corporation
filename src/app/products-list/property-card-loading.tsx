import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardLoading() {
  return (
    <Card className="relative gap-2 overflow-hidden p-4 px-1 shadow-md">
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="flex h-4 w-full" />
        <Skeleton className="flex h-4 w-full" />
        <Skeleton className="flex h-4 w-full" />
        <Skeleton className="flex h-4 w-full" />
        <Skeleton className="mx-auto my-2 flex h-24 w-1/2" />
      </CardContent>
      <CardFooter className="grid grid-cols-[3fr_1fr] items-end justify-center gap-4">
        <div className="flex w-full flex-col items-start justify-start gap-2 md:flex-row md:justify-between">
          <Skeleton className="flex h-4 w-1/2" />
          <Skeleton className="flex h-4 w-1/2" />
          <Skeleton className="flex h-4 w-1/2" />
        </div>
        <Skeleton className="flex h-8 w-full" />
      </CardFooter>
    </Card>
  );
}
