"use client";

import { useCallback } from "react";
// Important: this is the wrapper that triggers NextTopLoader on push/replace in App Router
import { useRouter as useTopLoaderRouter } from "nextjs-toploader/app";
import { useNavigationLock } from "@/context/navigation-lock-provider";

const NAV_DEBUG = process.env.NODE_ENV === "development";

export function useSafeRouter() {
  const router = useTopLoaderRouter();
  const { isNavigating, lock } = useNavigationLock();

  const push = useCallback(
    (href: string, opts?: { allowDuringNav?: boolean }) => {
      if (!opts?.allowDuringNav && isNavigating) {
        if (NAV_DEBUG) {
          console.info("[safe-router] block:push-already-navigating", { href });
        }
        return;
      }
      if (NAV_DEBUG) {
        console.info("[safe-router] push", {
          href,
          allowDuringNav: !!opts?.allowDuringNav,
        });
      }
      lock(`router.push:${href}`);
      router.push(href);
    },
    [isNavigating, lock, router]
  );

  const replace = useCallback(
    (href: string, opts?: { allowDuringNav?: boolean; scroll?: boolean }) => {
      if (!opts?.allowDuringNav && isNavigating) {
        if (NAV_DEBUG) {
          console.info("[safe-router] block:replace-already-navigating", {
            href,
          });
        }
        return;
      }
      if (NAV_DEBUG) {
        console.info("[safe-router] replace", {
          href,
          allowDuringNav: !!opts?.allowDuringNav,
          scroll: opts?.scroll,
        });
      }
      lock(`router.replace:${href}`);
      router.replace(href, { scroll: opts?.scroll });
    },
    [isNavigating, lock, router]
  );

  return { ...router, push, replace, isNavigating };
}
