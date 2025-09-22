"use client";
import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, onSnapshot, getCountFromServer, QueryConstraint
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase/client";
import { Order, OrderStatus } from "@/types/order";

export function useOrders({
  page = 1,
  pageSize = 10,
  userId,
  status,
  orderId,
}: {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: OrderStatus[];
  orderId?: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Keep a stable dependency for status
  const statusKey = JSON.stringify([...(status ?? [])].sort());

  useEffect(() => {
    let unsub: undefined | (() => void);
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setOrders([]); // prevent stale single-order state while switching

      // Single order fetch
      if (orderId) {
        const { doc, getDoc } = await import("firebase/firestore");
        const ref = doc(firestore, "orders", orderId);
        const snap = await getDoc(ref);
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data() as Order;
          setOrders([{ ...data, id: snap.id }]);
          setTotalItems(1);
        } else {
          setOrders([]);
          setTotalItems(0);
        }
        setLoading(false);
        return;
      }

      // List query + pagination
      const baseConstraints: QueryConstraint[] = [orderBy("updatedAt", "desc")];
      if (userId) baseConstraints.push(where("user.id", "==", userId));
      if (status && status.length > 0) baseConstraints.push(where("status", "in", status));

      const baseQuery = query(collection(firestore, "orders"), ...baseConstraints);

      const countSnap = await getCountFromServer(baseQuery);
      if (cancelled) return;
      setTotalItems(countSnap.data().count);

      const constraints = [...baseConstraints];
      if (page > 1) {
        const skipQuery = query(collection(firestore, "orders"), ...constraints, limit((page - 1) * pageSize));
        const skipped = await getDocs(skipQuery);
        const lastVisible = skipped.docs.at(-1);
        if (!lastVisible) {
          setOrders([]);
          setLoading(false);
          return;
        }
        constraints.push(startAfter(lastVisible));
      }

      const pageQuery = query(collection(firestore, "orders"), ...constraints, limit(pageSize));
      unsub = onSnapshot(pageQuery, (snapshot) => {
        if (cancelled) return;
        const docs = snapshot.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
        setOrders(docs);
        setLoading(false);
      });
    };

    run().catch(() => setLoading(false));

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
    // IMPORTANT: include orderId and a stable key for status
  }, [page, pageSize, userId, statusKey, orderId]);

  const totalPages = Math.ceil(totalItems / pageSize);
  return { orders, loading, totalItems, totalPages };
}
