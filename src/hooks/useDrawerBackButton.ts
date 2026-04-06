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
 */
export function useDrawerBackButton(open: boolean, onClose: () => void) {
  // Track whether WE pushed a sentinel entry so we know when to clean it up.
  const sentinelPushed = useRef(false);

  useEffect(() => {
    if (open) {
      // Push a sentinel state so the next back-press lands here.
      history.pushState({ drawerOpen: true }, "");
      sentinelPushed.current = true;

      const handlePopState = (_e: PopStateEvent) => {
        // Back was pressed — close the drawer. History already moved back by
        // the browser so the sentinel entry is already consumed; just set flag.
        sentinelPushed.current = false;
        onClose();
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      // Drawer closed via normal means (swipe / button, not back button).
      // If we still have a sentinel entry, consume it so history stays clean.
      if (sentinelPushed.current) {
        sentinelPushed.current = false;
        history.back();
      }
    }
  }, [open, onClose]);
}
