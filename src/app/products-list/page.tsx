import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import ProductList from "./product-list";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { ProductStatus } from "@/types/product";
import { getAllCategories } from "@/data/categories";
import ResponsiveProductFiltersServer from "./responsive-product-filters.server";
import { unslugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircleIcon } from "lucide-react";
import SearchButtonWrapper from "./search-button-wrapper";
import SearchPartNumber from "@/components/custom/search-part-number";
import ActionButtonsWrapper from "./action-buttons-wrapper";

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
  const brandId = searchParamsValues?.brandId ?? "";
  const brandName = unslugify(brandId);
  const statusParam = searchParamsValues.status ?? "";

  const newSearchParams = new URLSearchParams();
  if (brandId) {
    newSearchParams.set("brandId", brandId);
  }

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

  const categoriesPromise = getAllCategories(brandId);

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
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-60 w-full max-w-screen-lg flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md md:h-57 lg:h-57 ${!isAdmin && "pt-65 md:pt-70 lg:pt-70"} ${!isUser && "!h-53 !pt-0"}`}
      >
        <div className="mx-auto flex w-full max-w-screen-lg flex-col pt-8 md:pt-6">
          <EllipsisBreadCrumbs items={breadcrumbs} />
          <div className="mb-2 flex w-full flex-row items-center justify-between">
            <h1 className="py-2 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
              {brandName || "All"} <span className="text-lg">Products</span>
            </h1>
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
        className={`flex-1 overflow-y-auto px-4 pt-45 md:pt-43 lg:pt-40 ${!isAdmin && "pt-50 md:pt-53 lg:pt-55"} ${!isUser && "!pt-38"} pb-20`}
      >
        <ProductList
          isAdmin={isAdmin}
          searchParamsValues={searchParamsValues}
        />
      </div>
      <div className="fixed inset-x-0 bottom-7 z-30 mx-auto flex w-full max-w-screen-lg justify-end px-6">
        {isAdmin ? (
          <ActionButtonsWrapper newSearchParams={newSearchParams} />
        ) : (
          <SearchButtonWrapper />
        )}
      </div>
    </div>
  );
}
