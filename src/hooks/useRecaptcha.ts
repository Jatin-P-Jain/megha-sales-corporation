// hooks/useRecaptcha.ts
import { useEffect, useRef } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/client";

export function useRecaptcha() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;

    // Make sure container is there
    const container = document.getElementById("recaptcha-container");
    if (!container) {
      console.warn("reCAPTCHA container missing");
      return;
    }

    // If somehow a verifier still exists, clear it
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      delete window.recaptchaVerifier;
    }

    // Create the invisible verifier
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          // you can optionally handle token here
        },
      }
    );

    // Render it once
    window.recaptchaVerifier.render().catch((e) => {
      console.error("reCAPTCHA render failed:", e);
    });

    // ⚠️ DO NOT remove the container or delete recaptchaVerifier on unmount
    // return () => {
    //   /* no cleanup here */
    // };
  }, []);
}
