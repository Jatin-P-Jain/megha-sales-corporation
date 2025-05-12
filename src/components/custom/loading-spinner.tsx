import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-full h-full z-30 bg-accent/40",
        className
      )}
    >
      <Loader2 className="animate-spin" width={size} height={size} />
    </div>
  );
}
