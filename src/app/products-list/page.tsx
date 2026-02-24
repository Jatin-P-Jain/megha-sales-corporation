// app/products-list/page.tsx
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import ResponsiveProductFiltersServer from "./responsive-product-filters.server";
import CartOverviewSlot from "@/components/custom/cart-overview-slot";
import { unslugify } from "@/lib/utils";
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

  const breadcrumbs = [
    {
      href: isAdmin ? "/admin-dashboard/brands" : "/",
      label: isAdmin ? "All Brands" : "Home",
    },
    ...(brandName === "Filtered" || brandName === "All"
      ? []
      : [{ href: `/brands/${brandId}`, label: brandName ?? brandId }]),
    { label: "Product Listings" },
  ];

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-screen-lg flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md ${
          !isAdmin ? "h-60 md:h-70" : "h-48 md:h-55"
        } ${!isUser && "!h-45 md:!h-50"}`}
      >
        <div className="mx-auto flex w-full max-w-screen-lg flex-col pb-2">
          <EllipsisBreadCrumbs items={breadcrumbs} />
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="py-1 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
              {brandName || "All"} <span className="text-lg">Products</span>
            </h1>
          </div>

          <ResponsiveProductFiltersServer
            isAdmin={isAdmin}
            isUser={isUser}
            brandId={brandId}
          />

          {/* ✅ Decoupled; show for users only; all screens */}
          <CartOverviewSlot isUser={isUser} isAdmin={isAdmin} />
        </div>
      </div>

      <div
        className={`flex-1 overflow-auto px-4 ${
          !isAdmin ? "pt-42 md:pt-45" : "pt-30"
        } ${!isUser && "!pt-30 md:!pt-34"} pb-4 md:pb-0`}
      >
        <ProductListShell isAdmin={isAdmin} />
      </div>
    </div>
  );
}
