"use client";

import { useEffect } from "react";

export const ServiceWorkerRegister = () => {
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== "production";

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          // Register or update service worker in place.
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            {
              scope: "/",
              updateViaCache: "none",
            },
          );

          await registration.update();
          if (isDev) console.log("SW registered:", registration);

          await navigator.serviceWorker.ready;

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  if (isDev) console.log("New SW available");
                }
              });
            }
          });

          if (isDev) {
            navigator.serviceWorker.addEventListener("message", (event) => {
              console.log("Message from SW:", event.data);
            });
          }
        } catch {
          console.error("SW registration failed");
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    } else if (isDev) {
      console.log("Service workers are not supported in this browser");
    }
  }, []);

  return null;
};
