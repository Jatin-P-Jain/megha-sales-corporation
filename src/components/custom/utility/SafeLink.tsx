"use client";

import { useNavigationLock } from "@/context/navigation-lock-provider";
import Link from "next/link";
import React, { useCallback } from "react";

type SafeLinkProps = React.ComponentProps<typeof Link> & {
  disableWhileNavigating?: boolean;
};

export function SafeLink({
  disableWhileNavigating = true,
  onClick,
  ...props
}: SafeLinkProps) {
  const { isNavigating, lock } = useNavigationLock();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow normal browser behaviors (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        onClick?.(e);
        return;
      }

      if (disableWhileNavigating && isNavigating) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Lock immediately; let <Link> perform the navigation (keeps NextTopLoader auto behavior)
      lock();
      onClick?.(e);
    },
    [disableWhileNavigating, isNavigating, lock, onClick],
  );

  return (
    <Link
      {...props}
      onClick={handleClick}
      aria-disabled={disableWhileNavigating && isNavigating ? true : undefined}
      tabIndex={disableWhileNavigating && isNavigating ? -1 : undefined}
    />
  );
}
