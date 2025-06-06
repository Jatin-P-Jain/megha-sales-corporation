import { ProductSize, ProductStatus } from "./product";

export type CartProduct = {
  id: string;
  brandName: string;
  brandId: string;
  companyName: string;
  vehicleCompany: string;
  vehicleNames?: string[];
  partCategory: string;
  partNumber: string;
  partName: string;
  price: number;
  discount: number;
  gst: number;
  stock: number;
  hasSizes?: boolean;
  sizes?: ProductSize[];
  samePriceForAllSizes?: boolean;
  status: ProductStatus;
  image?: string;
  quantity: number; // added for cart
};
