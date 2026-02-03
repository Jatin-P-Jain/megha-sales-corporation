"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFireStore";
import { UserData } from "@/types/user";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserCard from "./user-card";
import UserCardSkeleton from "@/components/custom/user-card-skeleton";

export default function UsersList() {
  const PAGE_SIZE = process.env.NEXT_PUBLIC_PAGE_SIZE
    ? parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE)
    : 10;
  const router = useRouter();
  const searchParams = useSearchParams();
  const previousFiltersRef = useRef<string>("");

  const accountStatusValue = searchParams.get("accountStatus") || "";

  const filtersOnly = {
    accountStatus: accountStatusValue,
  };
  const filterKey = JSON.stringify(filtersOnly);

  // Convert comma-separated strings to arrays
  const accountStatuses = accountStatusValue
    ? accountStatusValue.split(",")
    : [];

  // Construct filters
  const filters = [
    ...(accountStatuses.length > 0
      ? [
          {
            field: "accountStatus",
            op: "in" as const,
            value: accountStatuses,
          },
        ]
      : []),
  ];

  const { data, loading, hasMore, currentPage, loadPage, totalItems } =
    usePaginatedFirestore<UserData>({
      collectionPath: "users",
      pageSize: PAGE_SIZE,
      orderByField: "createdAt",
      orderDirection: "desc",
      filters: filters,
    });

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // after loading becomes false
  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true);
    }
  }, [loading]);
  // ⏮ Reset to page 1 if filters change
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      previousFiltersRef.current = filterKey;

      // Reset page to 1 in URL
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`/admin-dashboard/users?${sp.toString()}`);
    }
  }, [filterKey, router, searchParams]);

  const handlePageChange = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", `${page}`);
    router.replace(`/admin-dashboard/users?${sp.toString()}`);
    loadPage(page);
  };

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  if (loading || !hasLoadedOnce) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4 px-4 py-6">
        {[...Array(4)].map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && hasLoadedOnce && data.length === 0) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 items-center justify-center">
        <p className="text-muted-foreground">No users found.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col">
      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-xs md:text-sm">
        Page {currentPage} • Showing {start}–{end} of {totalItems} results
      </p>
      {data.length > 0 && (
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col justify-between gap-4 py-2">
          <div className="flex w-full flex-1 flex-grow flex-col gap-5">
            {data.map((user: UserData, index: number) => (
              <UserCard
                key={index}
                user={user}
                onStatusUpdate={() => loadPage(currentPage)}
              />
            ))}
          </div>

          <Pagination className="z-50">
            <PaginationContent className="w-full items-center justify-center">
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    // href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                </PaginationItem>
              )}

              {(() => {
                const pageLinks = [];
                const visiblePages = new Set<number>();

                if (totalPages <= 7) {
                  // Show all pages if total pages are 7 or fewer
                  for (let i = 1; i <= totalPages; i++) {
                    visiblePages.add(i);
                  }
                } else {
                  // Always show first and last page
                  visiblePages.add(1);
                  visiblePages.add(totalPages);

                  // Show current page and two pages before & after
                  for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                    if (i > 1 && i < totalPages) {
                      visiblePages.add(i);
                    }
                  }
                }

                let prev: number | null = null;
                for (let i = 1; i <= totalPages; i++) {
                  if (!visiblePages.has(i)) continue;

                  if (prev !== null && i - prev > 1) {
                    pageLinks.push(
                      <PaginationItem key={`ellipsis-${i}`}>
                        <span className="text-muted-foreground px-2">...</span>
                      </PaginationItem>,
                    );
                  }

                  const isCurrent = i === currentPage;
                  pageLinks.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        // href="#"
                        onClick={() => handlePageChange(i)}
                        isActive={isCurrent}
                        className={clsx(
                          isCurrent && "bg-primary font-bold text-white",
                          "cursor-pointer",
                        )}
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>,
                  );

                  prev = i;
                }

                return pageLinks;
              })()}

              {hasMore && currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    // href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
