"use client";

import {
  CheckCircle2,
  ChevronDown,
  Clock,
  ClockFading,
  ImageOffIcon,
  Package,
  Truck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import currencyFormatter from "@/lib/currency-formatter";
import { CartProduct } from "@/types/cartProduct";
import { Order, OrderEventTimelineEvent } from "@/types/order";
import { cn, formatDateTime } from "@/lib/utils";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { OrderStatusDropdown } from "@/components/custom/order-status";
import { handleStatusChange } from "../orders";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { useUserGate } from "@/context/UserGateProvider";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/firebase/client";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const orderEventConfig: Record<
  OrderEventTimelineEvent["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  order_created: {
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  status_updated: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
};

const orderStatusConfig: Record<
  NonNullable<OrderEventTimelineEvent["status"]>,
  { icon: React.ElementType; color: string; bg: string }
> = {
  pending: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  packing: {
    icon: Package,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  dispatch: {
    icon: Truck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

function OrderTimelineItem({
  event,
  itemPosition,
  isAdmin,
  createdByDetail,
}: {
  event: OrderEventTimelineEvent;
  itemPosition: "first" | "middle" | "last";
  isAdmin?: boolean;
  createdByDetail?: string;
}) {
  const cfg = (event.status ? orderStatusConfig[event.status] : undefined) ??
    orderEventConfig[event.type] ?? {
      icon: Clock,
      color: "text-zinc-500",
      bg: "bg-zinc-100",
    };
  const Icon = cfg.icon;
  const timeStr = timeAgo(event.createdAt);
  const statusLabel = event.status
    ? event.status.charAt(0).toUpperCase() + event.status.slice(1)
    : "";

  const displayLabel =
    event.type === "order_created"
      ? isAdmin
        ? "Order placed"
        : "Order Placed"
      : event.type === "status_updated"
        ? `Order ${isAdmin ? "Moved" : "moved"} to "${statusLabel || "Updated"}"`
        : event.label;

  const displayDetail = isAdmin
    ? event.type === "order_created"
      ? createdByDetail
      : event.detail
    : undefined;

  return (
    <li className="relative flex gap-2">
      {itemPosition !== "last" && (
        <div className="bg-secondary-foreground/20 absolute top-7 left-3.5 h-full w-px" />
      )}

      <span
        className={cn(
          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          cfg.bg,
        )}
      >
        <Icon className={cn("size-4", cfg.color)} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col pb-5">
        <span className="text-secondary-foreground text-xs font-medium">
          {displayLabel}
        </span>

        {displayDetail && (
          <span className="text-secondary-foreground/70 text-[10px] font-medium">
            {displayDetail}
          </span>
        )}

        <span className="text-secondary-foreground/60 text-[10px]">
          {timeStr} | {formatDateTime(event.createdAt)}
        </span>
      </div>
    </li>
  );
}

export default function OrderDetails({
  order,
  isAdmin,
}: {
  order: Order;
  isAdmin: boolean;
}) {
  const router = useSafeRouter();
  const { clientUser } = useUserProfileState();
  const { userRole } = useUserGate();
  const [liveOrder, setLiveOrder] = useState<Order>(order);
  const roleForAudit = userRole ?? (isAdmin ? "admin" : "customer");
  const [timelineOpen, setTimelineOpen] = useState(true);

  useEffect(() => {
    setLiveOrder(order);
  }, [order]);

  useEffect(() => {
    const ref = doc(firestore, "orders", order.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      setLiveOrder({ id: snap.id, ...(snap.data() as Omit<Order, "id">) });
    });

    return () => unsub();
  }, [order.id]);

  const products = liveOrder.products as CartProduct[];
  const units = liveOrder.totals?.units ?? 0;
  const gst = liveOrder.totals?.gst ?? 0;
  const discount = liveOrder.totals?.discount ?? 0;
  const amount = liveOrder.totals?.amount ?? 0;
  const createdByDetail = `${liveOrder.user?.firmName ? `${liveOrder.user.firmName}` : ""} (${liveOrder.user?.displayName ?? "Customer"})`;
  const timelineEvents = liveOrder.orderEventTimeline ?? [];
  const sortedTimelineEvents = [...timelineEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 pb-3">
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-1 pl-2 text-xs font-semibold tracking-wide whitespace-nowrap uppercase">
          <Package className="inline-flex size-3" />
          Order Status:
        </span>
        <OrderStatusDropdown
          isAdmin={isAdmin}
          status={liveOrder.status}
          onChange={async (newStatus) => {
            const res = await handleStatusChange(
              liveOrder,
              newStatus,
              isAdmin,
              {
                ...clientUser,
                userRole: roleForAudit,
              },
            );
            if (res?.success) {
              router.refresh();
            }
          }}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-md border">
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[68%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
          </colgroup>
          <TableHeader className="">
            <TableRow className="text-xs">
              <TableHead className="text-muted-foreground">
                Product Details
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                Units
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>

        <ScrollArea className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="px-1 md:px-2">
            <Table className="w-full table-fixed border-separate [border-spacing:0_0.2rem]">
              <colgroup>
                <col className="w-[68%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
              </colgroup>
              <TableBody className="">
                {products.map((item) => {
                  const {
                    price = 0,
                    discount = 0,
                    gst = 0,
                  } = item.productPricing ?? {};
                  const qty = item.quantity;
                  const unitDiscount = Math.round((discount / 100) * price);
                  const unitPriceAfterDiscount = Math.round(
                    price - unitDiscount,
                  );
                  const unitGST = Math.round(
                    (gst / 100) * unitPriceAfterDiscount,
                  );
                  const unitNetPrice = Math.round(
                    unitPriceAfterDiscount + unitGST,
                  );
                  const totalPrice = Math.round(unitNetPrice * qty);
                  const productImage =
                    item.productImage ?? item.product?.image ?? undefined;

                  return (
                    <TableRow
                      key={item.cartItemKey}
                      className={clsx(
                        "bg-muted hover:bg-muted/90 [&>td]:border-border/60 [&>td]:border-y [&>td:first-child]:rounded-l-md [&>td:first-child]:border-l [&>td:last-child]:rounded-r-md [&>td:last-child]:border-r",
                      )}
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center justify-start gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white shadow-sm">
                            {productImage ? (
                              <Image
                                src={imageUrlFormatter(productImage)}
                                alt={item?.product?.partName ?? "Product image"}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center text-[10px]">
                                <ImageOffIcon className="h-4 w-4" />
                                <small>No Image</small>
                              </div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col items-start justify-start gap-0.5">
                            <span className="truncate font-semibold">
                              {item?.product?.partNumber}
                            </span>

                            <div className="flex w-full">
                              <span className="text-muted-foreground truncate text-xs">
                                <span className="font-medium">
                                  {item?.product?.brandName}
                                </span>
                                {" - "}
                                {item?.product?.partName}
                              </span>
                            </div>
                            {item.selectedSize && (
                              <span className="text-muted-foreground text-xs">
                                ({item.selectedSize})
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-normal">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-normal">
                        {currencyFormatter(totalPrice)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[68%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
          </colgroup>
          <TableFooter className="font-medium">
            <TableRow>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">{units}</TableHead>
              <TableHead className="text-right">
                {currencyFormatter(amount)}
              </TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="bg-muted flex items-center justify-between rounded-md p-2">
        <div className="text-muted-foreground text-xs">
          GST:{" "}
          <span className="inline-flex text-sm font-semibold">
            {currencyFormatter(gst)}
          </span>
        </div>
        <div className="text-muted-foreground text-xs">
          Discount:{" "}
          <span className="inline-flex text-sm font-semibold text-green-700">
            {currencyFormatter(discount)}
          </span>
        </div>
      </div>

      <Collapsible
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        className="shrink-0"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant={"ghost"}
            className="text-muted-foreground flex w-full items-center justify-between rounded-md py-2 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <ClockFading className="size-4" />
              Order Activity
              {/* {sortedTimelineEvents.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                  {sortedTimelineEvents.length} event
                  {sortedTimelineEvents.length > 1 ? "s" : ""}
                </Badge>
              )} */}
            </span>
            <ChevronDown
              className={clsx(
                "size-4 transition-transform duration-300",
                timelineOpen && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={clsx(
            "overflow-hidden transition-opacity duration-200",
            timelineOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="bg-secondary mb-2 max-h-24 overflow-y-auto rounded-md px-2 py-2 text-xs">
            {sortedTimelineEvents.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-xs md:py-3">
                No activity yet.
              </p>
            ) : (
              <ul>
                {sortedTimelineEvents.map((event, i) => (
                  <OrderTimelineItem
                    key={event.id}
                    event={event}
                    isAdmin={isAdmin}
                    createdByDetail={createdByDetail}
                    itemPosition={
                      i === sortedTimelineEvents.length - 1
                        ? "last"
                        : i === 0
                          ? "first"
                          : "middle"
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      <div className="mb-6 flex w-full shrink-0 items-center justify-center gap-2">
        <Button
          asChild
          variant={"outline"}
          size={"sm"}
          className="text-primary border-primary flex-1"
        >
          <Link href="/order-history">Order History</Link>
        </Button>
        <Button
          asChild
          variant={"outline"}
          size={"sm"}
          className="text-primary border-primary flex-1"
        >
          <Link href="/products-list">Explore Products</Link>
        </Button>
      </div>
    </div>
  );
}
