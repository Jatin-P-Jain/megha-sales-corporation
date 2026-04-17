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
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useMemo, useState } from "react";
import UserCardSkeleton from "@/components/custom/user-card-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import EnquiryCard from "./enquiry-card";
import { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { replyToEnquiry, updateEnquiryStatus } from "./actions";
import { useUserGate } from "@/context/UserGateProvider";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { FullUser } from "@/types/user";

type SearchField =
  | "createdBy.email"
  | "createdBy.phone"
  | "id"
  | "createdBy.displayName";

export default function EnquiriesList({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId?: string;
}) {
  const PAGE_SIZE = process.env.NEXT_PUBLIC_PAGE_SIZE
    ? parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE)
    : 10;
  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const previousFiltersRef = useRef<string>("");
  const [displayData, setDisplayData] = useState<Enquiry[]>([]);
  const searchField = searchParams.get("searchField") as SearchField | null;
  const searchQuery = searchParams.get("searchQuery") || "";

  const { gate } = useUserGate();
  useRequireUserProfile(true);
  const { clientUser } = useUserProfileState();

  const fullUser = useMemo(() => {
    return {
      ...clientUser,
      ...gate,
    } as FullUser;
  }, [clientUser, gate]);

  const statusKey = useMemo(() => {
    const all = searchParams.getAll("enquiryStatus");
    if (all.length > 0) return all.join(",");
    return searchParams.get("enquiryStatus") ?? "";
  }, [searchParams]);

  const enquiryStatuses = useMemo(() => {
    if (!statusKey.trim()) return [] as EnquiryStatus[];
    return statusKey.split(",").filter(Boolean) as EnquiryStatus[];
  }, [statusKey]);

  const filtersOnly = {
    enquiryStatuses,
    searchField,
    searchQuery,
  };
  const filterKey = JSON.stringify(filtersOnly);

  // Construct filters
  const filters = [
    // If not admin, scope to user
    ...(!isAdmin
      ? [
          {
            field: "userId",
            op: "==" as const,
            value: userId ?? "__missing__",
          },
        ]
      : []),
    ...(enquiryStatuses.length > 0
      ? [
          {
            field: "status",
            op: "in" as const,
            value: enquiryStatuses,
          },
        ]
      : []),
    // Add search filter
    ...(searchField && searchQuery
      ? [
          {
            field: searchField,
            op: "==" as const,
            value: searchQuery,
          },
        ]
      : []),
  ];

  const { data, loading, hasMore, currentPage, loadPage, totalItems } =
    usePaginatedFirestore<Enquiry>({
      collectionPath: "enquiries",
      pageSize: PAGE_SIZE,
      filters,
      orderByField: "updatedAt",
      orderDirection: "desc",
      realtime: true,
      queryKey: `enquiries-${filterKey}`, // Stable key for filter changes
    });

  // Sync displayData with hook data
  useEffect(() => {
    setDisplayData(data);
  }, [data]);

  // Reset to page 1 if filters change
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      previousFiltersRef.current = filterKey;

      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`/enquiries?${sp.toString()}`);
    }
  }, [filterKey, router, searchParams]);

  const handlePageChange = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", `${page}`);
    router.replace(`/enquiries?${sp.toString()}`);
    loadPage(page);
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("searchField");
    params.delete("searchQuery");
    params.delete("page");
    router.push(`/enquiries?${params.toString()}`);
  };

  const handleEnquiryUpdate = (updatedEnquiry: Enquiry) => {
    setDisplayData((prev) =>
      prev.map((e) => (e.id === updatedEnquiry.id ? updatedEnquiry : e)),
    );
  };

  const getFieldLabel = (field: SearchField) => {
    const labels: Record<SearchField, string> = {
      "createdBy.email": "Email",
      "createdBy.phone": "Phone",
      id: "Enquiry ID",
      "createdBy.displayName": "Name",
    };
    return labels[field];
  };

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

  if (loading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4 px-4 py-6">
        {[...Array(4)].map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col items-center justify-center gap-4">
        {searchField && searchQuery && (
          <Badge
            variant="secondary"
            className="flex items-center gap-2 px-3 py-1.5"
          >
            Searching {getFieldLabel(searchField)}:{" "}
            <strong>{searchQuery}</strong>
            <X className="h-3 w-3 cursor-pointer" onClick={handleClearSearch} />
          </Badge>
        )}
        <p className="text-muted-foreground">No Enquiries yet.</p>
        {searchField && searchQuery && (
          <Button variant="outline" onClick={handleClearSearch}>
            Clear Search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full flex-col">
      {/* Active Search Display */}
      {searchField && searchQuery && (
        <div className="flex w-full items-center justify-center gap-2 px-4">
          <Badge
            variant="secondary"
            className="flex flex-col items-center gap-2 px-3 py-2 md:flex-row"
          >
            Results for {getFieldLabel(searchField)}:{" "}
            <strong>{searchQuery}</strong>
          </Badge>
          {searchField && searchQuery && (
            <Button
              variant="secondary"
              size={"sm"}
              onClick={handleClearSearch}
              className="inline-flex border border-red-700 bg-transparent p-2! py-1! text-xs text-red-700"
            >
              <X className="size-3 cursor-pointer" /> Clear
            </Button>
          )}
        </div>
      )}

      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-xs md:text-sm">
        Page {currentPage} • Showing {start}–{end} of {totalItems} results
      </p>
      {data.length > 0 && (
        <div className="flex h-full w-full flex-1 flex-col justify-between gap-4 px-1 py-2">
          <div className="flex w-full flex-1 grow flex-col gap-3 md:gap-5">
            {displayData.map((enquiry: Enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                isAdmin={isAdmin}
                loggedInUser={fullUser}
                onStatusChange={async (status) => {
                  const result = await updateEnquiryStatus({
                    enquiryId: enquiry.id,
                    status,
                  });

                  if (!result.success) {
                    throw new Error(result.error || "Failed to update status");
                  }
                }}
                onUpdate={handleEnquiryUpdate}
                onReply={async (replyText) => {
                  const result = await replyToEnquiry({
                    enquiryId: enquiry.id,
                    replyText,
                    user: fullUser,
                    isAdminReply: isAdmin,
                  });

                  if (!result.success) {
                    throw new Error(result.error || "Failed to send reply");
                  }
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="z-50">
              <PaginationContent className="w-full items-center justify-center">
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                  </PaginationItem>
                )}

                {(() => {
                  const pageLinks = [];
                  const visiblePages = new Set<number>();

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) {
                      visiblePages.add(i);
                    }
                  } else {
                    visiblePages.add(1);
                    visiblePages.add(totalPages);

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
                          <span className="text-muted-foreground px-2">
                            ...
                          </span>
                        </PaginationItem>,
                      );
                    }

                    const isCurrent = i === currentPage;
                    pageLinks.push(
                      <PaginationItem key={i}>
                        <PaginationLink
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
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
