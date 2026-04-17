import { CartProduct } from "./cartProduct";
import { UserData } from "./user";
export type OrderStatus = "pending" | "packing" | "dispatch";
export type OrderEventTimelineEventType = "order_created" | "status_updated";

export type OrderEventTimelineEvent = {
  id: string;
  type: OrderEventTimelineEventType;
  label: string;
  detail?: string;
  status?: OrderStatus;
  createdAt: string;
  updatedBy?: UserData;
};
export type Order = {
  id: string;
  user: UserData;
  products: CartProduct[];
  totals: {
    items: number;
    units: number;
    gst?: number;
    discount?: number;
    amount: number;
  };
  status: OrderStatus;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  orderEventTimeline?: OrderEventTimelineEvent[];
};
