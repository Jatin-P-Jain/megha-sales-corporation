import ProductCard from "@/components/custom/product-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PAGE_SIZE } from "@/lib/utils";
import { Product } from "@/types/product";
import clsx from "clsx";

export default async function ProductList({
  productsPromise,
  isAdmin,
  page,
  searchParamsValues,
}: {
  productsPromise: Promise<{
    data: Product[];
    totalPages: number;
    totalItems: number;
  }>;
  isAdmin: boolean;
  page: number;
  searchParamsValues: {
    page: string;
    brandId: string;
    status: string;
    category: string | string[];
  };
}) {
  const pageSize = PAGE_SIZE;
  const [products] = await Promise.all([productsPromise]);
  const { data, totalPages, totalItems } = products;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col">
      <p className="text-muted-foreground sticky top-0 z-10 w-full px-4 py-1 text-center text-sm">
        Page {page} • Showing {start}–{end} of {totalItems} results
      </p>
      {data.length > 0 && (
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col justify-between gap-4 py-2">
          <div className="flex w-full flex-1 flex-grow flex-col gap-5">
            {data.map((product, index) => {
              return (
                <ProductCard key={index} product={product} isAdmin={isAdmin} />
              );
            })}
          </div>

          <Pagination>
            <PaginationContent className="w-full items-center justify-center">
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/products-list?page=${page - 1}`}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = page === pageNum;
                const newSearchParams = new URLSearchParams();
                Object.entries(searchParamsValues).forEach(([key, value]) => {
                  if (value !== undefined) {
                    if (Array.isArray(value)) {
                      value.forEach((v) => newSearchParams.append(key, v));
                    } else {
                      newSearchParams.set(key, value);
                    }
                  }
                });
                newSearchParams.set("page", `${pageNum}`);

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={`/products-list?${newSearchParams}`}
                      isActive={isCurrent}
                      className={clsx(
                        isCurrent && "bg-primary font-bold text-white",
                      )}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext href={`/products-list?page=${page + 1}`} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
      {data.length === 0 && (
        <div className="text-center font-medium text-cyan-900">
          No Products!
        </div>
      )}
    </div>
  );
}
