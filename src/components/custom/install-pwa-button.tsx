"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { X } from "lucide-react";
import { useOneTapReady } from "@/hooks/useOneTapReady";

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAButton() {
  const oneTapReady = useOneTapReady();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (!oneTapReady) {
      console.log("⏳ Waiting for One Tap to finish...");
      return;
    }
    // Only show if user hasn't dismissed or installed before
    const alreadyHandled = localStorage.getItem("pwa-install-dismissed");

    if (alreadyHandled) return;

    const handler = (e: unknown) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(event);
      setShowCard(true);
      console.log("✅ beforeinstallprompt event captured");
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [oneTapReady]);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      localStorage.setItem("pwa-install-dismissed", "true");

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the PWA install");
      } else {
        console.log("User dismissed the PWA install");
      }

      setDeferredPrompt(null);
      handleCancelClick();
    });
  };

  const handleCancelClick = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowCard(false);
  };

  if (!showCard) return null;

  return (
    <Card className="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-lg flex-col items-center justify-between gap-2 rounded-xl p-4 shadow-lg md:w-full md:flex-row">
      <div className="flex w-full flex-1 flex-col text-center md:text-left">
        <span className="text-primary text-sm font-medium">
          Install Megha Sales Corporation as an app.
        </span>
        <span className="text-xs text-gray-700">
          Shop auto parts faster with one-tap access — for a quicker, more
          convenient experience.
        </span>
      </div>

      <div className="flex w-full justify-between gap-2 md:w-auto">
        <Button
          variant="default"
          onClick={handleInstallClick}
          className="flex-1 md:flex-none"
        >
          Install App
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancelClick}
          className="absolute top-0 right-0 p-0 md:static"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
