import { CartProduct } from "./cartProduct";
import { UserData } from "./user";
export type OrderStatus = "pending" | "packing" | "dispatch";
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
  user: UserData;
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
