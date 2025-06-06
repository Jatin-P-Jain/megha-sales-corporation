import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { Suspense } from "react";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import ProductCardLoading from "../products-list/property-card-loading";
import { CartItems } from "./cart-items";
import CartSummary from "@/components/custom/cart-summary";

export default async function Cart() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-55 w-full max-w-screen-lg flex-col items-end justify-end rounded-lg bg-white px-4 py-4 shadow-md md:h-60`}
      >
        <div className="mx-auto flex w-full max-w-screen-lg flex-col pt-3 md:pt-6">
          <EllipsisBreadCrumbs
            items={[
              {
                href: `${isAdmin ? "/admin-dashboard" : "/"}`,
                label: `${isAdmin ? "Admin Dashboard" : "Home"}`,
              },
              { href: "/products-list", label: "Product Listings" },
              { label: "Cart" },
            ]}
          />
          <h1 className="py-2 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
            Your Cart
          </h1>
          <Suspense fallback={<div>Loading...</div>}>
            <CartSummary isUser={!!verifiedToken} />
          </Suspense>
        </div>
      </div>
      <div className={`flex h-[100%] flex-1 px-4 pt-43 md:pt-48`}>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <ProductCardLoading key={index} />
              ))}
            </div>
          }
        >
          <CartItems />
        </Suspense>
      </div>
    </div>
  );
}
