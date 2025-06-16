"use client";

import { useEffect } from "react";

export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((registration) => {
            console.log("SW registered:", registration);
          })
          .catch((err) => {
            console.error("SW registration failed:", err);
          });
      });
    }
  }, []);

  return null;
};
