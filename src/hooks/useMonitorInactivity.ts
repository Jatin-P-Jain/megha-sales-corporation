"use client";

import { useEffect } from "react";
import { logoutUser } from "@/context/firebase-auth";
import { removeToken } from "@/context/actions";
import { User } from "firebase/auth";

const useMonitorInactivity = (
  currentUser: User | null,
  INACTIVITY_LIMIT: number | null,
) => {
  useEffect(() => {
    if (!currentUser) return;

    const LAST_ACTIVITY_KEY = "lastActivity";

    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    const checkInactivity = async () => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0");
      const now = Date.now();
      const diff = now - last;

      if (INACTIVITY_LIMIT && diff >= INACTIVITY_LIMIT) {
        await logoutUser();
        await removeToken();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        window.location.href = "/login?sessionExpired=1";
      }
    };

    updateLastActivity(); // set immediately on mount

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) =>
      window.addEventListener(e, updateLastActivity, { passive: true }),
    );

    const interval = setInterval(checkInactivity, 60 * 1000); // check every 1 minute

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateLastActivity));
      clearInterval(interval);
    };
  }, [currentUser]);
};

export default useMonitorInactivity;
