"use client";

import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

const NARROW_SCREEN_THRESHOLD = 374;
const SHORT_SCREEN_HEIGHT_THRESHOLD = 574;

export default function ScreenWidthWarning() {
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const updateViewportState = () => {
      const isSmall =
        window.innerWidth < NARROW_SCREEN_THRESHOLD ||
        window.innerHeight < SHORT_SCREEN_HEIGHT_THRESHOLD;

      setIsSmallViewport(isSmall);

      if (!isSmall) {
        setIsDismissed(false);
      }
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    window.addEventListener("orientationchange", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
      window.removeEventListener("orientationchange", updateViewportState);
    };
  }, []);

  if (!isSmallViewport || isDismissed) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        aria-label="Dismiss screen size warning"
        className="bg-card absolute -top-2 right-2 rounded-full border border-amber-300/70 px-1 text-sm leading-none text-amber-900/70 hover:bg-amber-100 hover:text-amber-900 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-50 focus:outline-none"
        onClick={() => setIsDismissed(true)}
      >
        <XIcon className="size-4" />
      </button>
      Your screen is very narrow or short. Please switch to a larger screen for
      a better experience.
    </div>
  );
}
