"use client";

import { firestore } from "@/firebase/client";
import type { AccountTimelineEvent } from "@/types/user";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useAccountTimeline(uid?: string) {
  const [events, setEvents] = useState<AccountTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const ref = collection(firestore, "users", uid, "timeline");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AccountTimelineEvent[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type,
            label: d.label,
            detail: d.detail ?? undefined,
            createdAt:
              d.createdAt?.toDate?.()?.toISOString() ??
              new Date().toISOString(),
          };
        });
        setEvents(items);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load account timeline", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { events, loading };
}
