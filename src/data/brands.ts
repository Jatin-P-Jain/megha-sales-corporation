import { fireStore, getTotalPages } from "@/firebase/server";
import { Brand, BrandMedia } from "@/types/brand";
import { BrandStatus } from "@/types/brandStatus";
import "server-only";

type GetBrandsOptions = {
  filters?: {
    status: BrandStatus[] | null;
  };
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

export const getBrands = async (options?: GetBrandsOptions) => {
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;

  const { status } = options?.filters || {};

  let brandsQuery = fireStore.collection("brands").orderBy("updated", "desc");
  if (status) {
    brandsQuery = brandsQuery.where("status", "in", status);
  }

  const brandTotalPages = await getTotalPages(brandsQuery, pageSize);

  const brandsSnapshot = await brandsQuery
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .get();

  const brands = brandsSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    } as Brand;
  });

  return { data: brands, totalPages: brandTotalPages };
};

export const getBrandById = async (brandId: string) => {
  const brandSnapshot = await fireStore.collection("brands").doc(brandId).get();
  const rawBrandData = brandSnapshot.data()!;

  // build a pure‐JS object matching your Brand type
  const brand: Brand = {
    id: brandSnapshot.id,
    brandName: rawBrandData.brandName as string,
    brandLogo: rawBrandData.brandLogo as string,
    companies: (rawBrandData.companies as string[]) || [],
    vehicleCompanies: (rawBrandData.vehicleCompanies as string[]) || [],
    vehicleNames: (rawBrandData.vehicleNames as string[]) || [],
    partCategories: (rawBrandData.partCategories as string[]) || [],
    totalProducts: (rawBrandData.totalProducts as number) || 0,
    description: rawBrandData.description as string,
    status: rawBrandData.status as Brand["status"],
    brandMedia: (rawBrandData.brandMedia as BrandMedia[]) || [],
  };

  return brand;
};
export const getBrandsById = async (brandIds: string[]) => {
  if (!brandIds.length) {
    return [];
  }
  const brandsSnapshot = await fireStore
    .collection("properties")
    .where("__name__", "in", brandIds)
    .get();
  const brandsData = brandsSnapshot.docs.map((brand) => {
    return { id: brand.id, ...brand.data() } as Brand;
  });
  return brandsData;
};
