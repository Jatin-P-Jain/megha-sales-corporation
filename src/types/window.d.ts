// src/types/window.d.ts
import type { RecaptchaVerifier } from "firebase/auth";

export {};

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
    grecaptcha?: { reset: (id?: number) => void };
  }
}
