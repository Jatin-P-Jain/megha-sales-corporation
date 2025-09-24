"use client";
import {
  collection,
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
import { useEffect, useState } from "react";
import { firestore } from "@/firebase/client";
import { Order, OrderStatus } from "@/types/order";

export function useOrders({
  page = 1,
  pageSize = 10,
  userId,
  status,
}: {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: OrderStatus[];
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    let unsub: () => void;

    const fetch = async () => {
      setLoading(true);

      const baseConstraints: QueryConstraint[] = [orderBy("updatedAt", "desc")];

      if (userId) {
        baseConstraints.push(where("user.id", "==", userId));
      }

      if (status && status.length > 0) {
        baseConstraints.push(where("status", "in", status));
      }

      const baseQuery = query(
        collection(firestore, "orders"),
        ...baseConstraints,
      );

      // ✅ Get total count
      const countSnap = await getCountFromServer(baseQuery);
      setTotalItems(countSnap.data().count);

      // 🔁 Pagination startAfter
      if (page > 1) {
        const skipQuery = query(
          collection(firestore, "orders"),
          ...baseConstraints,
          limit((page - 1) * pageSize),
        );
        const skippedSnapshot = await getDocs(skipQuery);
        const lastVisible = skippedSnapshot.docs.at(-1);
        if (!lastVisible) {
          setOrders([]);
          setLoading(false);
          return;
        }
        baseConstraints.push(startAfter(lastVisible));
      }

      const paginatedQuery = query(
        collection(firestore, "orders"),
        ...baseConstraints,
        limit(pageSize),
      );

      unsub = onSnapshot(paginatedQuery, (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data() as Order;
          return {
            ...data,
            id: doc.id,
          };
        });
        setOrders(docs);
        setLoading(false);
      });
    };

    if (userId) fetch();

    return () => {
      if (unsub) unsub();
    };
  }, [page, pageSize, userId, status?.join(",")]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return { orders, loading, totalItems, totalPages };
}
