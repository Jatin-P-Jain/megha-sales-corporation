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
  lock: () => void;
  unlock: () => void;
};

const NavigationLockContext = createContext<NavigationLockContextValue | null>(null);

export function NavigationLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);

  // Avoid unlocking on the first mount (initial render)
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    // Any committed navigation changes URL -> unlock
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const value = useMemo<NavigationLockContextValue>(
    () => ({
      isNavigating,
      lock: () => setIsNavigating(true),
      unlock: () => setIsNavigating(false),
    }),
    [isNavigating],
  );

  return (
    <NavigationLockContext.Provider value={value}>{children}</NavigationLockContext.Provider>
  );
}

export function useNavigationLock() {
  const ctx = useContext(NavigationLockContext);
  if (!ctx)
    throw new Error("useNavigationLock must be used inside <NavigationLockProvider />");
  return ctx;
}
