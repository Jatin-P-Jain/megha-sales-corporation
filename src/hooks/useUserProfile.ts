"use client";

import { useUserProfileActions } from "@/context/UserProfileProvider";
import { useEffect } from "react";

export function useRequireUserProfile(enabled: boolean = false) {
  const { requireProfile } = useUserProfileActions();

  useEffect(() => {
    if (!enabled) return;
    const release = requireProfile();
    return () => release();
  }, [enabled, requireProfile]);
}
