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

export function useRecaptcha() {
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;

    const verifierInstance = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        // optional: mark as not ready
      },
    });

    verifierInstance.render().then((widgetId) => {
      window.recaptchaWidgetId = widgetId;
      window.recaptchaVerifier = verifierInstance;
      setVerifier(verifierInstance);
    });
  }, []);

  return verifier;
}
