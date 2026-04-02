import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import { CartItems } from "./cart-items";
import CartSummary from "@/components/custom/cart-summary";
import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";
import { ShoppingCart } from "lucide-react";

export default async function Cart() {
  const verifiedToken = await requireProfileCompleteOrRedirect("/cart");
  const isAdmin = Boolean(verifiedToken?.admin);

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
          <h1 className="py-2 text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
            Cart <ShoppingCart className="ml-1 inline-flex size-6" />
          </h1>
          <CartSummary isUser={!!verifiedToken} />
        </div>
      </div>
      <div className={`flex h-[100%] flex-1 pt-38 pb-4 md:pt-38`}>
        <CartItems />
      </div>
    </div>
  );
}
