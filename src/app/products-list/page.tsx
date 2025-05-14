import { Card } from "@/components/ui/card";
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
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-3 py-2 md:py-5">
      <div className="fixed z-10 w-full max-w-6xl px-0">
        <div className="max-w-sm bg-white pr-6 md:max-w-4xl md:pr-12 lg:max-w-5xl lg:pr-12 xl:max-w-6xl xl:pr-6">
          <h1 className="py-4 text-2xl font-[600] tracking-wide text-cyan-950">
            Product Listings
          </h1>
          <div className="flex flex-col gap-4 pb-4">
            <CategoryChips />
            <div className="grid w-full grid-cols-2 items-center justify-between gap-4">
              <Button variant={"outline"} className="w-full">
                <FunnelPlusIcon />
                Filters
              </Button>
              {isAdmin ? (
                <Button className="w-full">
                  <PlusCircleIcon className="" />
                  Add New Product
                </Button>
              ) : (
                <Button>
                  Proced to Cart <ArrowBigRightDashIcon className="size-5"/>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pt-45">
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
