"use client";

import { useEffect } from "react";

export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            {
              scope: "/",
            },
          );

          console.log("SW registered successfully:", registration);

          // Wait for the service worker to be ready
          const swRegistration = await navigator.serviceWorker.ready;
          console.log("SW ready:", swRegistration);
        } catch (error) {
          console.error("SW registration failed:", error);
        }
      };

      // Register on window load
      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
};
