import { BrandStatus } from "./brandStatus";
export type BrandMedia = { fileName: string; fileUrl: string };
export type Brand = {
  id: string;
  brandName: string;
  brandLogo: string;
  companies: string[];
  vehicleCategory: string;
  vehicleCompanies: string[];
  vehicleNames?: string[];
  partCategories: string[];
  totalProducts: number;
  description?: string;
  brandWebsite?: string;
  status: BrandStatus;
  brandMedia: BrandMedia[];
};
