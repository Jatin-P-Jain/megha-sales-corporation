"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type NavigationLockContextValue = {
  isNavigating: boolean;
  lock: (reason?: string) => void;
  unlock: (reason?: string) => void;
};

const NavigationLockContext = createContext<NavigationLockContextValue | null>(
  null,
);
const NAV_DEBUG = process.env.NODE_ENV === "development";

export function NavigationLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logNav = (event: string, details?: Record<string, unknown>) => {
    if (!NAV_DEBUG) return;
    console.info("[nav-lock]", event, details ?? {});
  };

  // Avoid unlocking on the first mount (initial render)
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    // Any committed navigation changes URL -> unlock
    setIsNavigating(false);
    logNav("unlock:route-committed", {
      pathname,
      search: searchParams?.toString() ?? "",
    });
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<NavigationLockContextValue>(
    () => ({
      isNavigating,
      lock: (reason) => {
        setIsNavigating(true);
        logNav("lock", {
          reason: reason ?? "unspecified",
          pathname,
          search: searchParams?.toString() ?? "",
        });

        // Failsafe: if a navigation is interrupted and URL never changes,
        // unlock to keep links responsive.
        if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
        unlockTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
          logNav("unlock:timeout", {
            timeoutMs: 10000,
            pathname,
            search: searchParams?.toString() ?? "",
          });
          unlockTimeoutRef.current = null;
        }, 10000);
      },
      unlock: (reason) => {
        if (unlockTimeoutRef.current) {
          clearTimeout(unlockTimeoutRef.current);
          unlockTimeoutRef.current = null;
        }
        setIsNavigating(false);
        logNav("unlock:manual", {
          reason: reason ?? "unspecified",
          pathname,
          search: searchParams?.toString() ?? "",
        });
      },
    }),
    [isNavigating, pathname, searchParams],
  );

  return (
    <NavigationLockContext.Provider value={value}>
      {children}
    </NavigationLockContext.Provider>
  );
}

export function useNavigationLock() {
  const ctx = useContext(NavigationLockContext);
  if (!ctx)
    throw new Error(
      "useNavigationLock must be used inside <NavigationLockProvider />",
    );
  return ctx;
}
