"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  onLoadingStatusChange,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");

  const handleLoadingStatusChange = React.useCallback(
    (nextStatus: "idle" | "loading" | "loaded" | "error") => {
      setStatus(nextStatus);
      onLoadingStatusChange?.(nextStatus);
    },
    [onLoadingStatusChange],
  );

  return (
    <>
      {status !== "loaded" && status !== "error" && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
        </span>
      )}
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn("aspect-square size-full", className)}
        onLoadingStatusChange={handleLoadingStatusChange}
        {...props}
      />
    </>
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
