"use client";

import { useEffect, useRef } from "react";

/**
 * Intercepts the device back-button while a drawer is open.
 *
 * When `open` becomes true  → pushes a sentinel history entry so the next
 *                              back-press lands on that entry instead of the
 *                              previous page.
 * When back is pressed       → the popstate fires, we detect our sentinel and
 *                              call `onClose()` to shut the drawer.
 * When `open` becomes false
 *   via normal close (swipe, button) → we programmatically go back one step
 *                              to consume the sentinel entry we pushed, keeping
 *                              the history stack tidy.
 *
 * IMPORTANT: if the component navigates (router.push) while the drawer is open
 * (e.g. an Apply button), call `markNavigated()` BEFORE router.push so the hook
 * knows not to call history.back() on close — which would undo the navigation.
 */
export function useDrawerBackButton(open: boolean, onClose: () => void) {
  const sentinelPushed = useRef(false);
  // Set to true by markNavigated() when a router.push fires while open.
  // Prevents history.back() cleanup from undoing the navigation.
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (open) {
      history.pushState({ drawerOpen: true }, "");
      sentinelPushed.current = true;
      navigatedRef.current = false; // reset on each open

      const handlePopState = (_e: PopStateEvent) => {
        sentinelPushed.current = false;
        navigatedRef.current = false;
        onClose();
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      if (sentinelPushed.current) {
        sentinelPushed.current = false;
        if (!navigatedRef.current) {
          // No navigation occurred — consume the sentinel cleanly.
          history.back();
        }
        // If navigation did occur, leave the history as-is. The sentinel
        // entry is now behind the new URL entry and harmless.
        navigatedRef.current = false;
      }
    }
  }, [open, onClose]);

  /** Call this before any router.push/replace that closes the drawer. */
  const markNavigated = () => {
    navigatedRef.current = true;
  };

  return { markNavigated };
}
