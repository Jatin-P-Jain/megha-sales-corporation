import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { auth } from "@/firebase/server";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import { CheckoutItems } from "./checkout-items";
import CheckoutFooter from "@/app/checkout/checkout-footer";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;
  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-45 w-full max-w-screen-lg flex-col items-end justify-end rounded-lg bg-white px-4 py-4 shadow-md md:h-50`}
      >
        <div className="mx-auto flex w-full max-w-screen-lg flex-col pt-3 md:pt-6">
          <EllipsisBreadCrumbs
            items={[
              {
                href: `${isAdmin ? "/admin-dashboard" : "/"}`,
                label: `${isAdmin ? "Admin Dashboard" : "Home"}`,
              },
              { href: "/products-list", label: "Product Listings" },
              { href: "/cart", label: "Cart" },
              { label: "Checkout" },
            ]}
          />
          <h1 className="py-2 text-xl font-[600] tracking-wide text-cyan-950 md:text-2xl">
            Checkout
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Review your items and total.{" "}
            <span className="font-semibold text-black">
              &apos;Confirm & Place Order&apos;
            </span>{" "}
            to complete.
          </p>
        </div>
      </div>
      <div
        className={`flex flex-1 overflow-auto scroll-auto px-4 pt-30 md:pt-38 !h-0`}
      >
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/*  */}
            </div>
          }
        >
          <CheckoutItems />
        </Suspense>
      </div>
      <div
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex h-fit w-full max-w-screen-lg flex-col items-end justify-end rounded-t-lg bg-white px-4 py-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}
      >
        <CheckoutFooter />
      </div>
    </div>
  );
}
