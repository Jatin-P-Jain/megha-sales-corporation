import { CartItems } from "./cart-items";
import CartSummary from "@/components/custom/cart-summary";
import { getVerifiedTokenOrRedirect } from "@/lib/auth/gaurds";
import { ShoppingCart } from "lucide-react";

export default async function Cart() {
  const verifiedToken = await getVerifiedTokenOrRedirect();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-44 w-full max-w-5xl flex-col items-end justify-end rounded-lg bg-white px-4 py-4 shadow-md md:h-50`}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col pt-3 md:gap-2 md:pt-6">
          <h1 className="py-1 text-xl font-semibold tracking-wide text-cyan-950">
            Cart <ShoppingCart className="ml-1 inline-flex size-6" />
          </h1>
          <CartSummary isUser={!!verifiedToken} />
        </div>
      </div>
      <div className={`flex h-full flex-1 pt-28 pb-4 md:pt-28`}>
        <CartItems />
      </div>
    </div>
  );
}
