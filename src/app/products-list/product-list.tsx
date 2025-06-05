import CartControls from "@/components/custom/cart-controls";
import ProductImage from "@/components/custom/product-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatINR, PAGE_SIZE, slugify } from "@/lib/utils";
import { Product } from "@/types/product";
import clsx from "clsx";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

export default async function ProductList({
  productsPromise,
  isAdmin,
  page,
}: {
  productsPromise: Promise<{
    data: Product[];
    totalPages: number;
    totalItems: number;
  }>;
  isAdmin: boolean;
  page: number;
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
            {data.map((product) => {
              const company = product.vehicleCompany;
              const names = Array.isArray(product.vehicleName)
                ? product.vehicleName.join(", ")
                : "";
              const vehicleNameProcessed = names
                ? `${company} - ${names}`
                : company;
              return (
                <Card
                  key={product?.id}
                  className="relative gap-0 overflow-hidden p-4 px-0 shadow-md"
                >
                  <CardContent className="grid text-sm md:grid-cols-[3fr_1fr] md:text-base">
                    <div className="flex flex-col gap-1 md:w-3/4 md:gap-2">
                      <div className="text-primary flex w-full items-center justify-between font-semibold">
                        <span className="text-sm font-normal">Brand :</span>
                        {product.brandName}
                      </div>
                      <div className="text-primary flex w-full items-center justify-between font-semibold">
                        <span className="text-sm font-normal">Part Name :</span>
                        <span className="line-clamp-1">{product.partName}</span>
                      </div>
                      <div className="text-primary flex w-full items-center justify-between font-semibold">
                        <span className="text-sm font-normal">
                          Part Number :
                        </span>
                        {product.partNumber}
                      </div>

                      <div className="text-primary flex w-full items-center justify-between font-semibold">
                        <span className="w-full text-sm font-normal">
                          Vehicle Name :
                        </span>
                        <div className="flex w-full items-end justify-end">
                          <span className="line-clamp-1">
                            {vehicleNameProcessed}
                          </span>
                        </div>
                      </div>
                      <div className="text-primary flex w-full items-center justify-between font-semibold">
                        <span className="text-sm font-normal">Category :</span>{" "}
                        {product.partCategory}
                      </div>
                    </div>
                    <div className="mb-2 flex min-h-20 w-full items-center justify-center md:min-h-30 md:w-full">
                      <ProductImage productImage={product?.image} />
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-[3fr_1fr] items-end justify-center gap-4">
                    <div className="flex w-full flex-col items-start justify-start md:flex-row md:justify-between">
                      <div className="text-primary flex items-center gap-2 text-lg font-semibold">
                        <span className="text-foreground text-base font-normal">
                          Price :
                        </span>
                        {formatINR(product?.price)}
                      </div>
                      <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                        <span className="text-foreground text-sm font-normal">
                          Discount :
                        </span>
                        {product?.discount}%
                      </div>
                      <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                        <span className="text-foreground font-normal">
                          GST :
                        </span>
                        {product?.gst}%
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-end gap-2">
                      {isAdmin ? (
                        <div className="flex w-full flex-col">
                          <div
                            className={`${
                              product.status === "draft"
                                ? "border-amber-100 bg-amber-100 text-yellow-600"
                                : product.status === "for-sale"
                                  ? "border-green-100 bg-green-100 text-green-700"
                                  : product.status === "out-of-stock"
                                    ? "border-zinc-100 bg-zinc-100 text-zinc-800"
                                    : product.status === "discontinued"
                                      ? "border-red-100 bg-red-100 text-red-600"
                                      : ""
                            } py-1font-semibold flex w-full items-center justify-center gap-1 rounded-t-lg border-1 px-1 pt-1 text-xs font-semibold`}
                          >
                            {product.status === "draft"
                              ? "DRAFT"
                              : product.status === "for-sale"
                                ? "FOR SALE"
                                : product.status === "out-of-stock"
                                  ? "OUT OF STOCK"
                                  : product.status === "discontinued"
                                    ? "DISCONTINUED"
                                    : ""}
                          </div>
                          <Button
                            variant={"outline"}
                            asChild
                            className={`${
                              product.status === "draft"
                                ? "border-amber-100"
                                : product.status === "for-sale"
                                  ? "border-green-100"
                                  : product.status === "out-of-stock"
                                    ? "border-zinc-100"
                                    : product.status === "discontinued"
                                      ? "border-red-100"
                                      : ""
                            } rounded-t-none`}
                          >
                            <Link
                              href={`/admin-dashboard/edit-product/${slugify(product?.brandName)}/${product?.id}`}
                            >
                              <PencilIcon />
                              Edit Product
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-end">
                          <CartControls
                            productId={product?.id}
                            productPricing={{
                              price: product.price,
                              discount: product?.discount,
                              gst: product?.gst,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
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
