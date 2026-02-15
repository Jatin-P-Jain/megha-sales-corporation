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
    };
    grecaptcha?: { reset: (id?: number) => void };
  }
}

export function useRecaptcha({
  enabled,
  containerId = "recaptcha-container",
}: UseRecaptchaParams): UseRecaptchaReturn {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);

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
    };

    const s = window.__firebaseRecaptchaSingleton;

    // If caller changed containerId, update it (but keep singleton verifier).
    s.containerId = containerId;

    // If verifier already exists, just ensure render finished.
    if (s.verifier) {
      if (s.renderPromise) await s.renderPromise;
      reset();
      setVerifier(s.verifier);
      return s.verifier;
    }

    const el = document.getElementById(containerId);
    if (!el) {
      // Firebase requires container to exist in DOM at init time. [web:138]
      throw new Error(`reCAPTCHA container #${containerId} not found`);
    }

    // For invisible, we can mount into an existing div; keep it empty at init.
    el.innerHTML = "";

    const v = new RecaptchaVerifier(auth, el, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {},
    });

    s.verifier = v;
    setVerifier(v);

    s.renderPromise =
      s.renderPromise ??
      v.render().then((id) => {
        s.widgetId = id;
        return id;
      });

    await s.renderPromise;
    reset();

    return v;
  }, [enabled, containerId, reset]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!enabled) {
      // When disabled, do NOT clear singleton (prevents re-init races).
      // Just reset best-effort.
      reset();
      setVerifier(window.__firebaseRecaptchaSingleton?.verifier ?? null);
      return;
    }

    // Eager init so clicking "Send OTP" doesn't race render.
    ensureReady().catch((e) => {
      console.error("Recaptcha init failed:", e);
    });
  }, [enabled, ensureReady, reset]);

  return { verifier, ensureReady, reset };
}
