import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";
import CheckoutShell from "./chekout-shell";

export default async function CheckoutPage() {
  const decoded = await requireProfileCompleteOrRedirect("/checkout");
  const isAdmin = Boolean(decoded.admin);
  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-4 relative">
      <CheckoutShell isAdmin={isAdmin} />
    </div>
  );
}
