// useRecaptcha.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

declare global {
  interface Window {
    __recaptchaSlots?: Record<
      string,
      {
        verifier: RecaptchaVerifier | null;
        widgetId: number | null;
        renderPromise: Promise<number> | null;
      }
    >;
    grecaptcha?: { reset: (id?: number) => void };
  }
}

type UseRecaptchaParams = {
  enabled: boolean;
  containerId?: string;
};

function getSlot(containerId: string) {
  if (typeof window === "undefined") return null;
  window.__recaptchaSlots ??= {};
  window.__recaptchaSlots[containerId] ??= {
    verifier: null,
    widgetId: null,
    renderPromise: null,
  };
  return window.__recaptchaSlots[containerId];
}

function cleanupSlot(containerId: string) {
  if (typeof window === "undefined") return;

  const slot = window.__recaptchaSlots?.[containerId];
  try {
    if (slot?.verifier) slot.verifier.clear();
  } catch {
    // ignore
  }

  // If grecaptcha is available, reset the widget id (safe best-effort).
  try {
    if (window.grecaptcha && typeof slot?.widgetId === "number") {
      window.grecaptcha.reset(slot.widgetId);
    }
  } catch {
    // ignore
  }

  // Clear any leftover DOM inside the container
  try {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = "";
  } catch {
    // ignore
  }

  if (window.__recaptchaSlots) {
    delete window.__recaptchaSlots[containerId];
  }
}

export function useRecaptcha({
  enabled,
  containerId = "recaptcha-container",
}: UseRecaptchaParams) {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const effectRunId = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If disabled, tear down any previous verifier for this container.
    if (!enabled) {
      cleanupSlot(containerId);
      setVerifier(null);
      return;
    }

    let cancelled = false;
    const runId = ++effectRunId.current;

    const init = async () => {
      try {
        const el = document.getElementById(containerId);
        if (!el) return;

        const slot = getSlot(containerId);
        if (!slot) return;

        // If a verifier already exists, just reuse it.
        if (slot.verifier) {
          setVerifier(slot.verifier);

          // If it was rendered earlier, reset so it can be used again.
          if (window.grecaptcha && typeof slot.widgetId === "number") {
            try {
              window.grecaptcha.reset(slot.widgetId);
            } catch {
              // ignore
            }
          }

          // If a render is still in-flight, await it (don’t call render twice).
          if (slot.renderPromise) {
            await slot.renderPromise;
          }
          return;
        }

        // Fresh init
        el.innerHTML = "";

        const verifierInstance = new RecaptchaVerifier(auth, el, {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {},
        });

        slot.verifier = verifierInstance;
        setVerifier(verifierInstance);

        // Render exactly once per containerId, share the same promise across re-renders.
        slot.renderPromise =
          slot.renderPromise ??
          verifierInstance
            .render()
            .then((id) => {
              slot.widgetId = id;
              return id;
            })
            .catch((err) => {
              // If render fails, cleanup so next try can recreate cleanly.
              try {
                verifierInstance.clear();
              } catch {
                // ignore
              }
              slot.verifier = null;
              slot.widgetId = null;
              slot.renderPromise = null;
              throw err;
            });

        await slot.renderPromise;

        // If effect re-ran / unmounted, don’t keep stale verifier around.
        if (cancelled || effectRunId.current !== runId) {
          cleanupSlot(containerId);
          setVerifier(null);
        }
      } catch (e) {
        console.error("Recaptcha init failed:", e);
        cleanupSlot(containerId);
        setVerifier(null);
      }
    };

    init();

    return () => {
      cancelled = true;
      // Important: cleanup on unmount/open-close so reopening a modal works.
      cleanupSlot(containerId);
      setVerifier(null);
    };
  }, [enabled, containerId]);

  return verifier;
}
