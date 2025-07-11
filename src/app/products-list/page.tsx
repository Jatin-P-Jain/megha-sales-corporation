import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { Suspense } from "react";
import { getProducts } from "@/data/products";
import ProductList from "./product-list";
import ProductCardLoading from "./property-card-loading";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { ProductStatus } from "@/types/product";
import { getAllCategories } from "@/data/categories";
import ResponsiveProductFiltersServer from "./responsive-product-filters.server";
import { PAGE_SIZE, unslugify } from "@/lib/utils";
import AboutBrandButton from "@/components/custom/about-brand.button";

export default async function ProductsList({
  searchParams,
}: {
  searchParams: Promise<{
    page: string;
    brandId: string;
    status: string;
    category: string | string[];
  }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;
  const isUser = verifiedToken ? true : false;

  const searchParamsValues = await searchParams;
  const parsedPage = parseInt(searchParamsValues.page);
  const page = isNaN(parsedPage) ? 1 : parsedPage;
  const brandId = searchParamsValues?.brandId ?? "";
  const brandName = unslugify(brandId);
  const statusParam = searchParamsValues.status ?? "";
  const categoryParam = searchParamsValues.category ?? "";
  const categoryFilters = Array.isArray(categoryParam)
    ? categoryParam
    : categoryParam
      ? [categoryParam]
      : [];

  const productsFilters: ProductStatus[] = [];
  if (statusParam) {
    if (Array.isArray(statusParam))
      statusParam.forEach((status) => {
        productsFilters.push(status as ProductStatus);
      });
    else {
      productsFilters.push(statusParam as ProductStatus);
    }
  } else if (!isAdmin) productsFilters.push("for-sale");

  const productsPromise = getProducts({
    filters: {
      brandId: brandId,
      status: productsFilters,
      partCategory: categoryFilters,
    },
    pagination: { page: page, pageSize: PAGE_SIZE },
  });

  const categoriesPromise = getAllCategories();

  const breadcrumbs = [
    {
      href: isAdmin ? "/admin-dashboard/brands" : "/",
      label: isAdmin ? "All Brands" : "Home",
    },
    ...(brandId
      ? [
          {
            href: `/brands/${brandId}`,
            label: brandName ?? brandId,
          },
        ]
      : []),
    {
      label: "Product Listings",
    },
  ];

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-60 w-full max-w-screen-lg flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md md:h-60 lg:h-55 ${!isAdmin && "pt-65 lg:pt-68"} ${!isUser && "!h-53 !pt-0"}`}
      >
        <div className="mx-auto flex w-full max-w-screen-lg flex-col pt-8 md:pt-6">
          <EllipsisBreadCrumbs items={breadcrumbs} />
          <div className="flex w-full flex-row items-center justify-between mb-2">
            <h1 className="py-2 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
              Product Listings
            </h1>
            <AboutBrandButton brandId={brandId} brandName={brandName} />
          </div>

          <ResponsiveProductFiltersServer
            isAdmin={isAdmin}
            isUser={isUser}
            categoriesPromise={categoriesPromise}
            brandId={brandId}
          />
        </div>
      </div>
      <div
        className={`flex-1 overflow-y-auto px-4 pt-45 md:pt-53 lg:pt-40 ${!isAdmin && "pt-50 lg:pt-55"} ${!isUser && "!pt-38"}`}
      >
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <ProductCardLoading key={index} />
              ))}
            </div>
          }
        >
          <ProductList
            productsPromise={productsPromise}
            isAdmin={isAdmin}
            page={page}
            searchParamsValues={searchParamsValues}
          />
        </Suspense>
      </div>
    </div>
  );
}
