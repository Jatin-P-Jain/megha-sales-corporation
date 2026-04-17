// app/products-list/page.tsx
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import ResponsiveProductFiltersServer from "./responsive-product-filters.server";
import CartOverviewSlot from "@/components/custom/cart-overview-slot";
import ProductListShell from "@/components/custom/products-list-shell";

type SP = {
  page?: string | string[];
  brandId?: string | string[];
  status?: string | string[];
  category?: string | string[];
};

export default async function ProductsList({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;

  const isAdmin = Boolean(verifiedToken?.admin);
  const isUser = Boolean(verifiedToken);

  const sp = await searchParams;

  const brandFilterValue =
    (Array.isArray(sp.brandId) ? sp.brandId[0] : sp.brandId) ?? "";
  const brandIds = brandFilterValue.split(",").filter(Boolean);

  let brandId: string;

  if (brandIds.length === 0) {
    brandId = "";
  } else if (brandIds.length === 1) {
    brandId = brandIds[0];
  } else {
    brandId = brandFilterValue;
  }

  const breadcrumbs = [
    {
      href: isAdmin ? "/admin-dashboard/brands" : "/",
      label: isAdmin ? "All Brands" : "Home",
    },
    { label: "Product Listings" },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-5xl flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md ${
          !isAdmin ? "h-52 md:h-58" : "h-38 md:h-48"
        } ${!isUser && "h-40! md:h-45!"}`}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5">
          <EllipsisBreadCrumbs items={breadcrumbs} />

          <ResponsiveProductFiltersServer
            isAdmin={isAdmin}
            isUser={isUser}
            brandId={brandId}
          />

          {(!isAdmin || isUser) && (
            <div className="pb-2">
              <CartOverviewSlot isUser={isUser} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>

      <div
        id="products-list-scroll-container"
        className={`flex-1 overflow-auto ${
          !isAdmin ? "pt-35 md:pt-32" : "pt-20 md:pt-22"
        } ${!isUser && "pt-22!"} pb-4 md:pb-0`}
      >
        <ProductListShell isAdmin={isAdmin} />
      </div>
    </div>
  );
}
