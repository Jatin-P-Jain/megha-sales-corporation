import { CartProduct } from "./cartProduct";
export type OrderStatus = "pending" | "packing" | "Complete";
export type OrderData = {
  products: CartProduct[];
  totals: {
    items: number;
    units: number;
    amount: number;
  };
  address?: string;
};
export type Order = {
  id: string;
  userId: string;
  products: CartProduct[];
  totals: {
    items: number;
    units: number;
    amount: number;
  };
  status: OrderStatus;
  address?: string;
  createdAt: string;
  updatedAt?: string;
};
