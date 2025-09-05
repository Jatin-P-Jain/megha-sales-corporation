"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { RefreshCcwIcon } from "lucide-react";

export default function NewVersionBanner() {
  const DEPLOY_VERSION = "20250804-v1.0.2";
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastSeenVersion = localStorage.getItem("app_deploy_version");
    const hasVisited = localStorage.getItem("has_visited");

    // Only show the banner if:
    // 1. User has visited before, and
    // 2. Version changed
    if (hasVisited && lastSeenVersion !== DEPLOY_VERSION) {
        setShowBanner(true);
    }

    // Mark this user as having visited (first page load)
    localStorage.setItem("has_visited", "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("app_deploy_version", DEPLOY_VERSION);
    window.location.reload();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 z-99999 flex w-full flex-col items-center justify-center gap-2 rounded-t-lg bg-yellow-300 p-4 md:rounded-none"
      style={{ boxShadow: "0px -8px 8px -8px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="text-primary font-semibold">App Update</div>
      <div className="flex flex-col justify-center items-center md:flex-row gap-2 md:gap-4">
        <span className="text-justify text-sm md:text-base">
          🎉 The app has been updated! Please refresh the page for the latest
          experience.
        </span>
        <Button
          onClick={handleDismiss}
          className="text-primary shadow-lg"
          variant={"outline"}
        >
          Refresh <RefreshCcwIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
