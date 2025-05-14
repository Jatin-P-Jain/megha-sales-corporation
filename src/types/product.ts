export type ProductStatus =
  | "draft"
  | "for-sale"
  | "discontinued"
  | "out-of-stock";

export type Product = {
  id: string;
  brandName: string;
  companyName: string;
  vehicleCompany: string;
  vehicleName: string;
  partCategory: string;
  partNumber: string;
  partName: string;
  price: number;
  discount: number;
  gst: number;
  stock: number;
  available: boolean;
  status: ProductStatus;
  image?: string;
};
