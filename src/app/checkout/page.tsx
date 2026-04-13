import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";
import CheckoutShell from "./chekout-shell";

export default async function CheckoutPage() {
  await requireProfileCompleteOrRedirect("/checkout");
  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-5xl">
      <CheckoutShell />
    </div>
  );
}
