import { Product } from "./product";

export type CartProduct = {
  id: string;
  product: Product;
  quantity: number; // added for cart
  selectedSize?: string; // added for cart
  cartItemKey: string; // added for cart
  productId?: string; // added for cart
  productPricing: {
    price?: number;
    discount?: number;
    gst?: number;
  };
};
