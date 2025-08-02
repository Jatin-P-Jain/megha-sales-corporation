export type ProductStatus =
  | "draft"
  | "for-sale"
  | "discontinued"
  | "out-of-stock";
export type ProductSize = {
  size: string;
  price?: number;
  discount?: number;
  gst?: number;
};
export type Product = {
  id: string;
  brandId: string;
  brandName: string;
  companyName: string;
  vehicleCompany: string;
  vehicleNames: string[];
  partCategory: string;
  partNumber: string;
  partName: string;
  price?: number;
  discount?: number;
  gst?: number;
  stock?: number;
  hasSizes?: boolean;
  sizes?: ProductSize[];
  samePriceForAllSizes?: boolean;
  status: ProductStatus;
  additionalDetails: string;
  image?: string;
};
