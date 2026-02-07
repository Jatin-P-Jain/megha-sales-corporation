// useRecaptcha.ts
import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
    grecaptcha?: { reset: (id?: number) => void };
  }
}

type UseRecaptchaParams = {
  enabled: boolean;
  containerId?: string;
};

export function useRecaptcha({ enabled, containerId = "recaptcha-container" }: UseRecaptchaParams) {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const initializing = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      if (initializing.current) return;
      initializing.current = true;

      try {
        // Wait until the container exists (AlertDialog content is mounted)
        const el = document.getElementById(containerId);
        if (!el) {
          initializing.current = false;
          return;
        }

        // If something already rendered into the container, clear it
        try {
          window.recaptchaVerifier?.clear();
        } catch {
          // ignore
        }
        el.innerHTML = "";

        const verifierInstance = new RecaptchaVerifier(auth, containerId, {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {},
        });

        const widgetId = await verifierInstance.render();
        if (cancelled) {
          try {
            verifierInstance.clear();
          } catch {
            // ignore
          }
          return;
        }

        window.recaptchaWidgetId = widgetId;
        window.recaptchaVerifier = verifierInstance;
        setVerifier(verifierInstance);
      } catch (e) {
        console.error("Recaptcha init failed:", e);
        setVerifier(null);
      } finally {
        initializing.current = false;
      }
    };

    // Run now, and again on next tick in case the DOM mounts right after open
    init();
    const t = window.setTimeout(init, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [enabled, containerId]);

  return verifier;
}
