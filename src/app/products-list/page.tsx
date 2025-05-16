import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { Suspense } from "react";
import { getProducts } from "@/data/products";
import ProductList from "./product-list";
import ProductCardLoading from "./property-card-loading";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import ResponsiveProductFilters from "@/components/custom/responsive-product-filters";

export default async function ProductsList({
  searchParams,
}: {
  searchParams: Promise<{
    page: string;
    brandId: string;
  }>;
}) {
  const searchParamsValues = await searchParams;
  const parsedPage = parseInt(searchParamsValues.page);
  const page = isNaN(parsedPage) ? 1 : parsedPage;

  const productsPromise = getProducts({
    filters: {
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
        <div className="mx-auto w-full max-w-screen-lg pt-3 md:pt-6">
          <EllipsisBreadCrumbs
            items={[
              {
                href: `${isAdmin ? "/admin-dashboard" : "/"}`,
                label: `${isAdmin ? "Admin Dashboard" : "Home"}`,
              },
              { label: "Product Listings" },
            ]}
          />
          <h1 className="py-4 pt-2 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
            Product Listings
          </h1>
          <ResponsiveProductFilters isAdmin={isAdmin} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-55 md:pt-60">
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
