"use client";

import { firestore } from "@/firebase/client";
import { UserNotification } from "@/types/notification";
import {
  collection,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export type RealtimeNotificationItem = UserNotification & { id: string };

type UseRealtimeNotificationsOptions = {
  uid?: string;
  limit?: number;
  includeItems?: boolean;
  initialItems?: RealtimeNotificationItem[];
  initialUnreadCount?: number;
};

export function useRealtimeNotifications({
  uid,
  limit = 100,
  includeItems = true,
  initialItems = [],
  initialUnreadCount = 0,
}: UseRealtimeNotificationsOptions) {
  const [items, setItems] = useState<RealtimeNotificationItem[]>(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    const notificationsRef = collection(
      firestore,
      "users",
      uid,
      "notifications"
    );

    if (!includeItems) {
      const unreadQuery = query(notificationsRef, where("read", "==", false));
      const unsubscribe = onSnapshot(
        unreadQuery,
        (snapshot) => {
          setUnreadCount(snapshot.size);
        },
        (error) => {
          console.error("Failed to sync unread notifications", error);
        }
      );

      return () => unsubscribe();
    }

    const notificationsQuery = query(
      notificationsRef,
      orderBy("createdAt", "desc"),
      qLimit(limit)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const nextItems: RealtimeNotificationItem[] = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...(doc.data() as UserNotification),
          })
        );

        setItems(nextItems);
        setUnreadCount(
          nextItems.reduce((acc, item) => (item.read ? acc : acc + 1), 0)
        );
      },
      (error) => {
        console.error("Failed to sync notifications in realtime", error);
      }
    );

    return () => unsubscribe();
  }, [uid, includeItems, limit]);

  return { items, unreadCount };
}
