import { PropertyStatus } from "./propertyStatus";

export type Property = {
  id: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  price: number;
  description: string;
  bathrooms: number;
  bedrooms: number;
  status: PropertyStatus;
  images?: string[];
};
