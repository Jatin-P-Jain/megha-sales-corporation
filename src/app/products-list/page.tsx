import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import ProductList from "./product-list";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { ProductStatus } from "@/types/product";
import ResponsiveProductFiltersServer from "./responsive-product-filters.server";
import { unslugify } from "@/lib/utils";
import SearchButtonWrapper from "./search-button-wrapper";
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
  const brandFilterValue = searchParamsValues?.brandId ?? "";

  // Split and filter empty strings
  const brandIds = brandFilterValue.split(",").filter((v) => v);

  let brandName: string;
  let brandId: string;

  if (brandIds.length === 0) {
    brandName = "All";
    brandId = "";
  } else if (brandIds.length === 1) {
    brandName = unslugify(brandIds[0]);
    brandId = brandIds[0];
  } else {
    brandName = "Filtered";
    brandId = brandFilterValue;
  }
  const statusParam = searchParamsValues.status ?? "*";

  const newSearchParams = new URLSearchParams();
  if (brandFilterValue) {
    newSearchParams.set("brandId", brandFilterValue);
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

  const breadcrumbs = [
    {
      href: isAdmin ? "/admin-dashboard/brands" : "/",
      label: isAdmin ? "All Brands" : "Home",
    },
    ...(brandName == "Filtered" || brandName == "All"
      ? []
      : [
          {
            href: `/brands/${brandId}`,
            label: brandName ?? brandId,
          },
        ]),
    {
      label: "Product Listings",
    },
  ];

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-screen-lg flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md ${!isAdmin ? "h-60 pt-60 md:pt-67" : "h-55 pt-0"} ${!isUser && "!h-53 !pt-0"}`}
      >
        <div className="mx-auto flex w-full max-w-screen-lg flex-col pt-8 md:pt-6">
          <EllipsisBreadCrumbs items={breadcrumbs} />
          <div className="mb-0 flex w-full flex-row items-center justify-between">
            <h1 className="py-2 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
              {brandName || "All"} <span className="text-lg">Products</span>
            </h1>
          </div>

          <ResponsiveProductFiltersServer
            isAdmin={isAdmin}
            isUser={isUser}
            brandId={brandId}
          />
        </div>
      </div>
      <div
        className={`flex-1 overflow-auto px-4 ${!isAdmin ? "pt-43 md:pt-52" : "pt-40"} ${!isUser && "!pt-38"} pb-20`}
      >
        <ProductList
          isAdmin={isAdmin}
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
