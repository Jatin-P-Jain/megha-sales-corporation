export type FilterOptions = {
  brands: {
    id: string;
    name: string;
    logo: string;
    categories: string[];
  }[];
  vehicleCompanies: string[];
  categories: string[];
  prices: {
    min: number;
    max: number;
  };
  discount: {
    min: number;
    max: number;
  };
};
