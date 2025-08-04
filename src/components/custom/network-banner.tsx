"use client";
import clsx from "clsx";
import { useEffect, useState } from "react";

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g" | string;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
}

export default function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    function updateNetworkStatus() {
      setIsOffline(!navigator.onLine);
      const nav = window.navigator as NavigatorWithConnection;
      const connection = nav.connection;
      if (connection && connection.effectiveType) {
        setIsSlowConnection(
          ["slow-2g", "2g"].includes(connection.effectiveType),
        );
      } else {
        setIsSlowConnection(false);
      }
    }

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    const nav = window.navigator as NavigatorWithConnection;
    if (nav.connection && nav.connection.addEventListener) {
      nav.connection.addEventListener("change", updateNetworkStatus);
    }
    updateNetworkStatus();

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      if (nav.connection && nav.connection.removeEventListener) {
        nav.connection.removeEventListener("change", updateNetworkStatus);
      }
    };
  }, []);

  if (!isOffline && !isSlowConnection) return null;

  return (
    <div
      className={clsx(
        "fixed top-15 z-50 w-full p-2 text-center text-sm text-white md:top-20 md:text-base",
        isOffline ? "bg-red-600" : isSlowConnection ? "bg-amber-500" : "",
      )}
    >
      <div className="font-semibold">
        {isOffline ? "⚠️ No Internet" : "⚠️ Slow Internet"}
      </div>
      {isOffline
        ? "You are currently offline. Please check your internet connection."
        : "Your internet connection is slow. Switch to a faster network for the best experience."}
    </div>
  );
}
