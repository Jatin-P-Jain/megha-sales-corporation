"use client";

import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  startAfter,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { firestore } from "@/firebase/client";
import { Product } from "@/types/product";
import { UserData } from "@/types/user";

type UsePaginatedFirestoreOptions<T> = {
  collectionPath: string;
  pageSize?: number;
  filters?: {
    field: string;
    op: "==" | "in" | ">=" | "<=";
    value: string | string[] | number;
  }[];
  orderByField?: string;
  orderDirection?: "asc" | "desc";
};

export const usePaginatedFirestore = <T extends Product | UserData>({
  collectionPath,
  pageSize = 10,
  filters = [],
  orderByField = "updated",
  orderDirection = "desc",
}: UsePaginatedFirestoreOptions<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const cursors = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([
    null,
  ]);
  const prevQueryKey = useRef("");

  const loadPage = async (targetPage: number) => {
    if (!hasMore && targetPage > currentPage) return;
    setLoading(true);
    try {
      // Find nearest previous page with a cursor
      let basePage = 1;
      for (let i = targetPage - 1; i >= 1; i--) {
        if (cursors.current[i]) {
          basePage = i + 1; // we already have cursor for page i, so basePage is i+1
          break;
        }
      }

      // If basePage is not targetPage, we need to step through pages to build cursors
      for (let page = basePage; page <= targetPage; page++) {
        let q = query(collection(firestore, collectionPath));
        collectionPath === "users"
          ? (q = query(q, orderBy("updatedAt", "desc")))
          : (q = query(q, orderBy(orderByField, orderDirection)));
        filters.forEach((f) => {
          q = query(q, where(f.field, f.op, f.value));
        });

        const cursor = cursors.current[page - 1];
        console.log({ cursors: cursors.current });

        if (cursor) {
          q = query(q, startAfter(cursor));
        }

        q = query(q, limit(pageSize));
        const snapshot = await getDocs(q);
        console.log({ snapshotDocs: snapshot.docs });

        // Map documents with proper typing
        const docs = snapshot.docs.map((doc) => {
          console.log({ doc });

          const docData = doc.data();
          console.log({ docData });

          // For UserData, use uid; for Product, use id
          if (collectionPath === "users") {
            return { uid: doc.id, ...docData } as T;
          }
          return { id: doc.id, ...docData } as T;
        });

        // Save cursor for this page
        cursors.current[page] = snapshot.docs.at(-1) ?? null;

        // When this is the final target page, update UI state
        if (page === targetPage) {
          setHasMore(snapshot.docs.length === pageSize);
          setData(docs);
          setCurrentPage(page);
        }
      }
    } catch (err) {
      console.error("Pagination fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetPagination = () => {
    cursors.current = [null];
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    const queryKey = JSON.stringify({
      collectionPath,
      filters,
      orderByField,
      orderDirection,
    });
    if (prevQueryKey.current !== queryKey) {
      prevQueryKey.current = queryKey;
      resetPagination();
      loadPage(1);

      // Fetch total item count
      const fetchCount = async () => {
        try {
          let countQuery = query(collection(firestore, collectionPath));
          filters.forEach((f) => {
            countQuery = query(countQuery, where(f.field, f.op, f.value));
          });
          const snapshot = await getCountFromServer(countQuery);
          setTotalItems(snapshot.data().count);
        } catch (error) {
          console.error("Failed to fetch count:", error);
          setTotalItems(0);
        }
      };

      fetchCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, JSON.stringify(filters), orderByField, orderDirection]);

  return {
    data,
    loading,
    hasMore,
    currentPage,
    totalItems,
    loadPage,
    resetPagination,
  };
};
