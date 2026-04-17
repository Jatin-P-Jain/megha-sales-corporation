"use client";

import { useCallback, useEffect, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

type UseRecaptchaParams = {
  enabled: boolean;
  containerId?: string;
};

type UseRecaptchaReturn = {
  verifier: RecaptchaVerifier | null;
  ensureReady: () => Promise<RecaptchaVerifier>;
  reset: () => void;
};

declare global {
  interface Window {
    __firebaseRecaptchaSingleton?: {
      verifier: RecaptchaVerifier | null;
      widgetId: number | null;
      renderPromise: Promise<number> | null;
      containerId: string;
      containerEl: HTMLElement | null;
    };
    grecaptcha?: { reset: (id?: number) => void };
  }
}

export function useRecaptcha({
  enabled,
  containerId = "recaptcha-container",
}: UseRecaptchaParams): UseRecaptchaReturn {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);

  const clearSingleton = useCallback(() => {
    const s = window.__firebaseRecaptchaSingleton;
    if (!s) return;

    try {
      s.verifier?.clear();
    } catch {
      // ignore
    }

    s.verifier = null;
    s.widgetId = null;
    s.renderPromise = null;
    s.containerEl = null;
  }, []);

  const reset = useCallback(() => {
    const s = window.__firebaseRecaptchaSingleton;
    try {
      if (window.grecaptcha && typeof s?.widgetId === "number") {
        window.grecaptcha.reset(s.widgetId);
      }
    } catch {
      // ignore
    }
  }, []);

  const ensureReady = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("reCAPTCHA can only be initialized in the browser");
    }
    if (!enabled) {
      throw new Error("reCAPTCHA is disabled");
    }

    window.__firebaseRecaptchaSingleton ??= {
      verifier: null,
      widgetId: null,
      renderPromise: null,
      containerId,
      containerEl: null,
    };

    const s = window.__firebaseRecaptchaSingleton;

    // Make sure the container exists before doing anything
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`reCAPTCHA container #${containerId} not found`);

    // If we already have a verifier:
    // - Reuse only when it still targets the same live DOM element
    // - Otherwise clear and recreate (common after route changes/logout)
    if (s.verifier) {
      const sameContainerId = s.containerId === containerId;
      const sameElement = s.containerEl === el;
      const oldElementDetached = !!s.containerEl && !s.containerEl.isConnected;

      if (!sameContainerId || !sameElement || oldElementDetached) {
        clearSingleton();
      } else {
        // Same container: ensure render finished, reset, return existing
        if (s.renderPromise) await s.renderPromise;
        reset();
        setVerifier(s.verifier);
        return s.verifier;
      }
    }

    // New container or no existing verifier => create & render once
    s.containerId = containerId;

    // Important: don't keep old markup
    el.innerHTML = "";

    const v = new RecaptchaVerifier(auth, el, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {},
    });

    s.verifier = v;
    s.containerEl = el;

    s.renderPromise = v.render().then((id) => {
      s.widgetId = id;
      window.recaptchaWidgetId = id;
      return id;
    });

    window.recaptchaVerifier = v;

    await s.renderPromise;
    reset();

    setVerifier(v);
    return v;
  }, [enabled, containerId, clearSingleton, reset]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!enabled) {
      clearSingleton();
      setVerifier(null);
      return;
    }

    // Eager init to avoid race on "Send OTP" click (optional)
    ensureReady().catch((e) => {
      console.error("Recaptcha init failed:", e);
    });
  }, [enabled, ensureReady, clearSingleton]);

  return { verifier, ensureReady, reset };
}
