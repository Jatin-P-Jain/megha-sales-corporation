"use client";

import { useCallback } from "react";
// Important: this is the wrapper that triggers NextTopLoader on push/replace in App Router
import { useRouter as useTopLoaderRouter } from "nextjs-toploader/app";
import { useNavLock } from "@/context/navigation-lock-provider";

export function useSafeRouter() {
  const router = useTopLoaderRouter();
  const { isNavigating, lock } = useNavLock();

  const push = useCallback(
    (href: string, opts?: { allowDuringNav?: boolean }) => {
      if (!opts?.allowDuringNav && isNavigating) return;
      lock();
      router.push(href);
    },
    [isNavigating, lock, router]
  );

  const replace = useCallback(
    (href: string, opts?: { allowDuringNav?: boolean; scroll?: boolean }) => {
      if (!opts?.allowDuringNav && isNavigating) return;
      lock();
      router.replace(href, { scroll: opts?.scroll });
    },
    [isNavigating, lock, router]
  );

  return { ...router, push, replace, isNavigating };
}
