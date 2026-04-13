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
  href,
  target,
  ...props
}: SafeLinkProps) {
  const { isNavigating, lock } = useNavigationLock();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const hrefValue = typeof href === "string" ? href : String(href);

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

      onClick?.(e);

      // Respect user handlers that intentionally cancel navigation.
      if (e.defaultPrevented) {
        return;
      }

      // Opening in a new tab/window does not change current URL, so do not lock.
      if (target && target !== "_self") {
        return;
      }

      // Do not lock for non-app links that won't route via Next.js.
      if (typeof href === "string") {
        if (
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("#")
        ) {
          return;
        }
      }

      // Lock immediately; let <Link> perform the navigation (keeps NextTopLoader auto behavior)
      lock(`SafeLink:${hrefValue}`);
    },
    [disableWhileNavigating, href, isNavigating, lock, onClick, target],
  );

  return (
    <Link
      {...props}
      href={href}
      target={target}
      onClick={handleClick}
      aria-disabled={disableWhileNavigating && isNavigating ? true : undefined}
      tabIndex={disableWhileNavigating && isNavigating ? -1 : undefined}
    />
  );
}
