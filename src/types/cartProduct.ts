import { ProductStatus } from "./product";

export type CartProduct = {
  id: string;
    brandName: string;
    companyName: string;
    vehicleCompany: string;
    vehicleName?: string[];
    partCategory: string;
    partNumber: string;
    partName: string;
    price: number;
    discount: number;
    gst: number;
    stock: number;
    status: ProductStatus;
    image?: string;
  quantity: number; // added for cart
};
