"use client";
import {
  collection,
  DocumentData,
  QueryDocumentSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  getCountFromServer,
  QueryConstraint,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
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
  const cursorCache = useRef<
    Map<number, QueryDocumentSnapshot<DocumentData> | null>
  >(new Map([[1, null]]));
  const queryKeyRef = useRef<string>("");

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
      const normalizedStatus = [...(status ?? [])].sort();
      if (userId) baseConstraints.push(where("user.id", "==", userId));
      if (normalizedStatus.length > 0) {
        baseConstraints.push(where("status", "in", normalizedStatus));
      }

      const queryKey = JSON.stringify({
        orderId: orderId ?? null,
        userId: userId ?? null,
        status: normalizedStatus,
        pageSize,
      });

      if (queryKeyRef.current !== queryKey) {
        queryKeyRef.current = queryKey;
        cursorCache.current = new Map([[1, null]]);
      }

      const baseQuery = query(
        collection(firestore, "orders"),
        ...baseConstraints
      );

      const countSnap = await getCountFromServer(baseQuery);
      if (cancelled) return;
      setTotalItems(countSnap.data().count);

      const constraints = [...baseConstraints];
      if (page > 1) {
        let startCursor = cursorCache.current.get(page);

        if (startCursor === undefined) {
          let nearestPage = 1;
          for (const cachedPage of cursorCache.current.keys()) {
            if (cachedPage < page && cachedPage > nearestPage) {
              nearestPage = cachedPage;
            }
          }

          let cursor = cursorCache.current.get(nearestPage) ?? null;
          for (let p = nearestPage; p < page; p += 1) {
            const walkConstraints = [...baseConstraints];
            if (cursor) {
              walkConstraints.push(startAfter(cursor));
            }

            const walkQuery = query(
              collection(firestore, "orders"),
              ...walkConstraints,
              limit(pageSize)
            );
            const walkSnap = await getDocs(walkQuery);
            const nextCursor = walkSnap.docs.at(-1) ?? null;
            cursorCache.current.set(p + 1, nextCursor);
            cursor = nextCursor;
          }

          startCursor = cursorCache.current.get(page);
        }

        if (startCursor === null || startCursor === undefined) {
          setOrders([]);
          setLoading(false);
          return;
        }

        constraints.push(startAfter(startCursor));
      }

      const pageQuery = query(
        collection(firestore, "orders"),
        ...constraints,
        limit(pageSize)
      );
      unsub = onSnapshot(pageQuery, (snapshot) => {
        if (cancelled) return;
        const docs = snapshot.docs.map((d) => ({
          ...(d.data() as Order),
          id: d.id,
        }));
        const nextCursor = snapshot.docs.at(-1) ?? null;
        cursorCache.current.set(page + 1, nextCursor);
        setOrders(docs);
        setLoading(false);
      });
    };

    run().catch(() => setLoading(false));

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [page, pageSize, userId, status, orderId]);

  const totalPages = Math.ceil(totalItems / pageSize);
  return { orders, loading, totalItems, totalPages };
}
