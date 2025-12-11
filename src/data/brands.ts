import { fireStore, getTotalPages } from "@/firebase/server";
import { Brand, BrandMedia } from "@/types/brand";
import { BrandStatus } from "@/types/brandStatus";
import "server-only";

type BrandOptions = {
  filters?: {
    status: BrandStatus[] | null;
  };
};
type GetBrandsOptions = {
  filters?: {
    status?: BrandStatus[] | null;
    getAll?: boolean;
    brandId?: string;
  };
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

export const VEHICLE_CATEGORIES: { lcv: string; hcv: string; both: string } = {
  lcv: "Light Commercial Vehicles (LCV)",
  hcv: "Heavy Commercial Vehicles (HCV)",
  both: "LCV & HCV",
};
export const getBrandsForDropDown = async (options?: BrandOptions) => {
  const { status } = options?.filters || {};
  let brandsQuery = fireStore.collection("brands").orderBy("updated", "desc");
  if (status) {
    brandsQuery = brandsQuery.where("status", "in", status);
  }
  const brandsSnapshot = await brandsQuery.get();
  const brands = brandsSnapshot.docs.map((doc) => {
    const rawBrandData = doc.data()!;

    // build a pure‐JS object matching your Brand type
    const brand: Brand = {
      id: doc.id,
      brandName: rawBrandData?.brandName as string,
      brandLogo: rawBrandData?.brandLogo as string,
      companies: (rawBrandData?.companies as string[]) || [],
      vehicleCategory: rawBrandData?.vehicleCategory as string,
      vehicleCompanies: (rawBrandData?.vehicleCompanies as string[]) || [],
      vehicleNames: (rawBrandData?.vehicleNames as string[]) || [],
      partCategories: (rawBrandData?.partCategories as string[]) || [],
      totalProducts: (rawBrandData?.totalProducts as number) || 0,
      description: rawBrandData?.description as string,
      brandWebsite: (rawBrandData?.brandWebsite as string) || "",
      status: rawBrandData?.status as Brand["status"],
      brandMedia: (rawBrandData?.brandMedia as BrandMedia[]) || [],
    };
    return brand;
  });

  return { data: brands };
};
export const getBrands = async (options?: GetBrandsOptions) => {
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;

  const { status, brandId } = options?.filters || {};

  let brandsQuery = fireStore
    .collection("brands")
    .orderBy("totalProducts", "desc");
  if (status && status.length > 0) {
    brandsQuery = brandsQuery.where("status", "in", status);
  }
  if (brandId) {
    brandsQuery = brandsQuery.where("id", "==", brandId);
  }

  let brandsSnapshot;
  let brandTotalPages;
  let totalItems;

  if (pageSize) {
    const brandTotal = await getTotalPages(brandsQuery, pageSize);
    brandTotalPages = brandTotal?.totalPages;
    totalItems = brandTotal?.totalItems;

    brandsSnapshot = await brandsQuery
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();
  } else {
    brandsSnapshot = await brandsQuery.get();
  }
  const brands = brandsSnapshot.docs.map((doc) => {
    const rawBrand = doc.data();
    const brand: Brand = {
      id: rawBrand.id,
      brandName: rawBrand?.brandName as string,
      brandLogo: rawBrand?.brandLogo as string,
      companies: (rawBrand?.companies as string[]) || [],
      vehicleCategory: rawBrand?.vehicleCategory as string,
      vehicleCompanies: (rawBrand?.vehicleCompanies as string[]) || [],
      vehicleNames: (rawBrand?.vehicleNames as string[]) || [],
      partCategories: (rawBrand?.partCategories as string[]) || [],
      totalProducts: (rawBrand?.totalProducts as number) || 0,
      description: rawBrand?.description as string,
      brandWebsite: (rawBrand?.brandWebsite as string) || "",
      status: rawBrand?.status as Brand["status"],
      brandMedia: (rawBrand?.brandMedia as BrandMedia[]) || [],
    };
    return brand;
  });
  return {
    data: brands,
    totalPages: brandTotalPages,
    totalItems: totalItems,
  };
};
export const getBrandById = async (brandId: string) => {
  const brandSnapshot = await fireStore.collection("brands").doc(brandId).get();
  const rawBrandData = brandSnapshot.data()!;

  // build a pure‐JS object matching your Brand type
  const brand: Brand = {
    id: rawBrandData.id,
    brandName: rawBrandData?.brandName as string,
    brandLogo: rawBrandData?.brandLogo as string,
    companies: (rawBrandData?.companies as string[]) || [],
    vehicleCategory: rawBrandData?.vehicleCategory as string,
    vehicleCompanies: (rawBrandData?.vehicleCompanies as string[]) || [],
    vehicleNames: (rawBrandData?.vehicleNames as string[]) || [],
    partCategories: (rawBrandData?.partCategories as string[]) || [],
    totalProducts: (rawBrandData?.totalProducts as number) || 0,
    description: rawBrandData?.description as string,
    brandWebsite: (rawBrandData?.brandWebsite as string) || "",
    status: rawBrandData?.status as Brand["status"],
    brandMedia: (rawBrandData?.brandMedia as BrandMedia[]) || [],
  };

  return brand;
};
export const getBrandsById = async (brandIds: string[]) => {
  if (!brandIds.length) {
    return [];
  }
  const brandsSnapshot = await fireStore
    .collection("brands")
    .where("__name__", "in", brandIds)
    .get();
  const brandsData = brandsSnapshot.docs.map((brand) => {
    return { id: brand.id, ...brand.data() } as Brand;
  });
  return brandsData;
};
