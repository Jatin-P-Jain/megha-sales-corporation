export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";
import { getOrderById } from "@/data/orders";
import OrderDetails from "./order-details";
import OrderDetailHeader from "./order-detail-header";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const verifiedToken =
    await requireProfileCompleteOrRedirect("/order-history");
  const isAdmin = Boolean(verifiedToken?.admin);
  const { orderId } = await params;

  const result = await getOrderById(orderId);
  const order = result?.data?.[0];

  if (!order) {
    notFound();
  }

  if (!isAdmin && order.user?.uid !== verifiedToken?.uid) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-40 w-full max-w-5xl flex-col items-start justify-end rounded-lg bg-white p-3 shadow-md md:h-48`}
      >
        <OrderDetailHeader orderId={orderId} />
      </div>

      <div
        className={`fixed inset-x-0 mx-auto w-full max-w-5xl overflow-hidden px-3 ${
          !isAdmin ? "top-44 bottom-0 md:top-52" : "top-44 bottom-0 md:top-58"
        }`}
      >
        <OrderDetails order={order} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
