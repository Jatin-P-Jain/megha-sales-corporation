import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { Suspense } from "react";
import { getProducts } from "@/data/products";
import ProductList from "./product-list";
import ProductCardLoading from "./property-card-loading";
import { Button } from "@/components/ui/button";
import {
  ArrowBigRightDashIcon,
  FunnelPlusIcon,
  PlusCircleIcon,
} from "lucide-react";
import CategoryChips from "@/components/custom/category-selection-chips";
import Link from "next/link";

export default async function ProductsList({
  searchParams,
}: {
  searchParams: Promise<{
    page: string;
    minPrice: string;
    maxPrice: string;
    minBedrooms: string;
  }>;
}) {
  const searchParamsValues = await searchParams;
  const parsedPage = parseInt(searchParamsValues.page);
  const parsedMinPrice = parseInt(searchParamsValues.minPrice);
  const parsedMaxPrice = parseInt(searchParamsValues.maxPrice);
  const parsedMinBedrooms = parseInt(searchParamsValues.minBedrooms);
  const page = isNaN(parsedPage) ? 1 : parsedPage;
  const minPrice = isNaN(parsedMinPrice) ? null : parsedMinPrice;
  const maxPrice = isNaN(parsedMaxPrice) ? null : parsedMaxPrice;
  const minBedrooms = isNaN(parsedMinBedrooms) ? null : parsedMinBedrooms;

  const productsPromise = getProducts({
    filters: {
      minPrice: minPrice,
      maxPrice: maxPrice,
      minBedrooms: minBedrooms,
      status: ["for-sale"],
    },
    pagination: { page: page, pageSize: 6 },
  });

  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      <div className="fixed top-17 z-30 w-full max-w-screen-lg rounded-xl bg-white px-4 shadow-md md:py-2">
        <div className="mx-auto w-full max-w-screen-lg">
          <h1 className="py-4 text-2xl font-[600] tracking-wide text-cyan-950">
            Product Listings
          </h1>
          <div className="flex flex-col gap-2 pb-4">
            <CategoryChips />
            <div className="grid w-full grid-cols-[1fr_6fr] items-center justify-between gap-2">
              <Button variant={"outline"} className="h-full w-full">
                <FunnelPlusIcon />
                {/* Filters */}
              </Button>
              {isAdmin ? (
                <Button className="w-full" asChild>
                  <Link href={"/admin-dashboard/new-product"}>
                    <PlusCircleIcon className="" />
                    Add New Product
                  </Link>
                </Button>
              ) : (
                <div className="grid grid-cols-[4fr_1fr] items-center justify-center rounded-lg border-1 p-1 pl-2 text-sm">
                  <div className="flex flex-col pr-4">
                    <div className="text-muted-foreground">Total Cart</div>
                    <div className="flex w-full justify-between">
                      <div>Items: <span className="font-semibold text-primary">17</span></div>
                      <div>
                        Amount: <span className="font-semibold text-primary">₹1,50,000</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full">
                    Cart <ArrowBigRightDashIcon className="size-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-45 md:pt-50">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardLoading key={index} />
              ))}
            </div>
          }
        >
          <ProductList
            productsPromise={productsPromise}
            isAdmin={isAdmin}
            searchParamsValues={searchParamsValues}
            page={page}
          />
        </Suspense>
      </div>
    </div>
  );
}
