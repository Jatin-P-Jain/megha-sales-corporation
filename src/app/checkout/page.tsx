import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";
import CheckoutShell from "./chekout-shell";

export default async function CheckoutPage() {
  await requireProfileCompleteOrRedirect("/checkout");
  return (
    <div className="relative mx-auto flex max-w-5xl">
      <CheckoutShell />
    </div>
  );
}
