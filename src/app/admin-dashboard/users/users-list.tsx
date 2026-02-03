"use client";

import ProductCardSkeleton from "@/components/custom/product-card-skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/context/useAuth";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFireStore";
import { UserData } from "@/types/user";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserCard from "./user-card";

export default function UsersList() {
  const PAGE_SIZE = process.env.NEXT_PUBLIC_PAGE_SIZE
    ? parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE)
    : 10;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data, loading, hasMore, currentPage, loadPage, totalItems } =
    usePaginatedFirestore<UserData>({
      collectionPath: "users",
      pageSize: PAGE_SIZE,
    });

  console.log({ data });

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // after loading becomes false
  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true);
    }
  }, [loading]);

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
        {[...Array(6)].map((_, i) => (
          <ProductCardSkeleton key={i} />
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
      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-sm">
        Page {currentPage} • Showing {start}–{end} of {totalItems} results
      </p>
      {data.length > 0 && (
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col justify-between gap-4 py-2">
          <div className="flex w-full flex-1 flex-grow flex-col gap-5">
            {data.map((user: UserData, index: number) => (
              <UserCard key={index} user={user} />
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
