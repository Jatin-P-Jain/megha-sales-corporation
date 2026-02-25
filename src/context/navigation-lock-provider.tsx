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

type NavLockContextValue = {
  isNavigating: boolean;
  lock: () => void;
  unlock: () => void;
};

const NavLockContext = createContext<NavLockContextValue | null>(null);

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

  const value = useMemo<NavLockContextValue>(
    () => ({
      isNavigating,
      lock: () => setIsNavigating(true),
      unlock: () => setIsNavigating(false),
    }),
    [isNavigating],
  );

  return (
    <NavLockContext.Provider value={value}>{children}</NavLockContext.Provider>
  );
}

export function useNavLock() {
  const ctx = useContext(NavLockContext);
  if (!ctx)
    throw new Error("useNavLock must be used inside <NavLockProvider />");
  return ctx;
}
