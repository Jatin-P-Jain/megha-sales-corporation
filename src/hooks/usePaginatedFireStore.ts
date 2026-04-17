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
  onSnapshot,
  Unsubscribe,
  Query,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firestore } from "@/firebase/client";
import { Product } from "@/types/product";
import { FullUser, UserData } from "@/types/user";
import { Order } from "@/types/order";
import { Enquiry } from "@/types/enquiry";

type UsePaginatedFirestoreOptions = {
  collectionPath: string;
  pageSize?: number;
  filters?: {
    field: string;
    op: "==" | "in" | ">=" | "<=" | "!=";
    value: string | string[] | number | boolean;
  }[];
  orderByField?: string;
  orderDirection?: "asc" | "desc";

  // ✅ new: realtime updates for currently loaded page
  realtime?: boolean;

  // ✅ new: caller can pass stable key to avoid stringify deps footguns
  queryKey?: string;

  // ✅ new: optional count refresh interval (tradeoff)
  countRefreshMs?: number;
};

export const usePaginatedFirestore = <
  T extends Product | UserData | Order | FullUser | Enquiry
>({
  collectionPath,
  pageSize = 10,
  filters = [],
  orderByField = "updated",
  orderDirection = "desc",
  realtime = false,
  queryKey,
  countRefreshMs,
}: UsePaginatedFirestoreOptions) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [countLoading, setCountLoading] = useState(false);

  const cursors = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([
    null,
  ]);
  const prevQueryKey = useRef("");

  // active realtime subscription (only for current page)
  const unsubRef = useRef<Unsubscribe | null>(null);

  const effectiveQueryKey = useMemo(() => {
    if (queryKey) return queryKey;

    // For realtime with filters, use a stable string key
    try {
      return JSON.stringify({
        collectionPath,
        filters: filters.length > 0 ? filters : undefined,
        orderByField,
        orderDirection,
        pageSize,
      });
    } catch {
      // Fallback for circular reference errors
      return `${collectionPath}-${orderByField}-${filters.length}`;
    }
  }, [
    queryKey,
    collectionPath,
    filters,
    orderByField,
    orderDirection,
    pageSize,
  ]);

  const buildQueryBase = useCallback(
    (cursorDoc?: QueryDocumentSnapshot<DocumentData> | null) => {
      const constraints = [];

      // 1. Add WHERE constraints first
      filters.forEach((f) => {
        constraints.push(where(f.field, f.op, f.value));
      });

      // 2. Add ORDER BY
      if (collectionPath === "users") {
        constraints.push(orderBy("updatedAt", "desc"));
      } else {
        constraints.push(orderBy(orderByField, orderDirection));
      }

      // 3. Add CURSOR (startAfter) - must be after orderBy
      if (cursorDoc) {
        constraints.push(startAfter(cursorDoc));
      }

      // 4. Add LIMIT last
      constraints.push(limit(pageSize));

      return query(collection(firestore, collectionPath), ...constraints);
    },
    [collectionPath, filters, orderByField, orderDirection, pageSize]
  );

  const mapDocs = useCallback(
    (docs: QueryDocumentSnapshot<DocumentData>[]) => {
      return docs.map((d) => {
        const docData = d.data();

        if (collectionPath === "users") {
          return { uid: d.id, ...docData } as T;
        }
        return { id: d.id, ...docData } as T;
      });
    },
    [collectionPath]
  );

  const stopRealtime = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  const fetchCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const constraints = filters.map((f) => where(f.field, f.op, f.value));
      const countQuery = query(
        collection(firestore, collectionPath),
        ...constraints
      );
      const snapshot = await getCountFromServer(countQuery);
      setTotalItems(snapshot.data().count);
    } catch (error) {
      console.error("Failed to fetch count:", error);
      setTotalItems(0);
    } finally {
      setCountLoading(false);
    }
  }, [collectionPath, filters]);

  const resetPagination = useCallback(() => {
    stopRealtime();
    cursors.current = [null];
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
  }, [stopRealtime]);

  // Build missing cursors up to targetPage-1 (only if needed)
  const ensureCursorForPrevPage = useCallback(
    async (targetPage: number) => {
      if (targetPage <= 1) return;

      // if we already have cursor for previous page, we are good
      if (cursors.current[targetPage - 1]) return;

      // build sequentially until we have cursor for targetPage-1
      for (let page = 1; page < targetPage; page++) {
        if (cursors.current[page]) continue;

        const prevCursor = cursors.current[page - 1];
        const q = buildQueryBase(prevCursor);

        const snapshot = await getDocs(q);

        cursors.current[page] = snapshot.docs.at(-1) ?? null;

        // If this page is not full, there are no further pages
        if (snapshot.docs.length < pageSize) break;
      }
    },
    [buildQueryBase, pageSize]
  );

  const loadPage = useCallback(
    async (targetPage: number) => {
      if (targetPage < 1) return;
      if (!hasMore && targetPage > currentPage) return;

      setLoading(true);

      try {
        // stop existing listener before switching page
        stopRealtime();

        // build cursors only if missing
        await ensureCursorForPrevPage(targetPage);

        const cursor = cursors.current[targetPage - 1] ?? null;
        const q = buildQueryBase(cursor);

        if (realtime) {
          try {
            // For realtime pagination, we use a hybrid approach:
            // 1. First fetch the initial data to ensure UI updates immediately
            // 2. Then set up the listener for realtime updates
            const initialSnapshot = await getDocs(q);
            const initialDocs = mapDocs(initialSnapshot.docs);
            cursors.current[targetPage] = initialSnapshot.docs.at(-1) ?? null;

            setHasMore(initialSnapshot.docs.length === pageSize);
            setData(initialDocs);
            setCurrentPage(targetPage);

            // Set up realtime listener for ongoing updates
            unsubRef.current = onSnapshot(
              q as Query<DocumentData>,
              (snapshot) => {
                const docs = mapDocs(snapshot.docs);
                cursors.current[targetPage] = snapshot.docs.at(-1) ?? null;

                setHasMore(snapshot.docs.length === pageSize);
                setData(docs);
                setCurrentPage(targetPage);

                // Re-fetch total count when docs are added or removed so the
                // "X of Y" display stays accurate on every page in real-time.
                const hasStructuralChange = snapshot
                  .docChanges()
                  .some((c) => c.type === "added" || c.type === "removed");
                if (hasStructuralChange) {
                  void fetchCountRef.current();
                }
              },
              (err) => {
                console.error(
                  `[usePaginatedFirestore] Realtime pagination error for ${collectionPath}:`,
                  err
                );
              }
            );
            setLoading(false);
          } catch (err) {
            console.error(
              `[usePaginatedFirestore] Failed to set up realtime pagination for ${collectionPath}:`,
              err
            );
            setLoading(false);
          }
          return;
        }

        // non-realtime (your original behavior)
        const snapshot = await getDocs(q);
        const docs = mapDocs(snapshot.docs);

        cursors.current[targetPage] = snapshot.docs.at(-1) ?? null;

        setHasMore(snapshot.docs.length === pageSize);
        setData(docs);
        setCurrentPage(targetPage);
      } catch (err) {
        console.error("Pagination fetch error:", err);
      } finally {
        if (!realtime || !unsubRef.current) setLoading(false);
      }
    },
    [
      buildQueryBase,
      collectionPath,
      currentPage,
      ensureCursorForPrevPage,
      hasMore,
      mapDocs,
      pageSize,
      realtime,
      stopRealtime,
    ]
  );

  // Store callbacks in refs so the effect below doesn't re-run (and kill the
  // realtime listener) every time loadPage/fetchCount change reference.
  const loadPageRef = useRef(loadPage);
  const fetchCountRef = useRef(fetchCount);
  useEffect(() => {
    loadPageRef.current = loadPage;
    fetchCountRef.current = fetchCount;
  });

  useEffect(() => {
    if (prevQueryKey.current !== effectiveQueryKey) {
      prevQueryKey.current = effectiveQueryKey;

      resetPagination();
      loadPageRef.current(1);
      fetchCountRef.current();
    }

    return () => {
      stopRealtime();
    };
    // resetPagination and stopRealtime are stable (empty useCallback deps).
    // loadPage/fetchCount are intentionally read via refs above.
  }, [effectiveQueryKey, resetPagination, stopRealtime]);

  // optional periodic count refresh
  useEffect(() => {
    if (!countRefreshMs) return;
    const t = setInterval(fetchCount, countRefreshMs);
    return () => clearInterval(t);
  }, [countRefreshMs, fetchCount]);

  return {
    data,
    loading,
    hasMore,
    currentPage,
    totalItems,
    countLoading,
    loadPage,
    resetPagination,
    refreshCount: fetchCount,
  };
};
