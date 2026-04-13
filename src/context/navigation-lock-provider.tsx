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

export function NavigationLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Avoid unlocking on the first mount (initial render)
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    // Any committed navigation changes URL -> unlock
    setIsNavigating(false);
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
      lock: () => {
        setIsNavigating(true);

        // Failsafe: if a navigation is interrupted and URL never changes,
        // unlock to keep links responsive.
        if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
        unlockTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
          unlockTimeoutRef.current = null;
        }, 10000);
      },
      unlock: () => {
        if (unlockTimeoutRef.current) {
          clearTimeout(unlockTimeoutRef.current);
          unlockTimeoutRef.current = null;
        }
        setIsNavigating(false);
      },
    }),
    [isNavigating],
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
