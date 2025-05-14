import { fireStore, getTotalPages } from "@/firebase/server";
import { Product, ProductStatus } from "@/types/product";
import { Property } from "@/types/property";
import { PropertyStatus } from "@/types/propertyStatus";
import "server-only";

type GetPropertiesOptions = {
  filters?: {
    minPrice?: number | null;
    maxPrice?: number | null;
    minBedrooms?: number | null;
    status: ProductStatus[] | null;
  };
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

export const getProducts = async (options?: GetPropertiesOptions) => {
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;

  const { minPrice, maxPrice, minBedrooms, status } = options?.filters || {};

  let productsQuery = fireStore
    .collection("products")
    .orderBy("updated", "desc");
  // if (minPrice != null && minPrice != undefined) {
  //   productsQuery = productsQuery.where("price", ">=", minPrice);
  // }
  // if (maxPrice != null && maxPrice != undefined) {
  //   productsQuery = productsQuery.where("price", "<=", maxPrice);
  // }
  // if (minBedrooms != null && minBedrooms != undefined) {
  //   productsQuery = productsQuery.where("bedrooms", ">=", minBedrooms);
  // }
  if (status) {
    productsQuery = productsQuery.where("status", "in", status);
  }

  const productsTotalPages = await getTotalPages(productsQuery, pageSize);

  const productsSnapshot = await productsQuery
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .get();

  const products = productsSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    } as Product;
  });

  return { data: products, totalPages: productsTotalPages };
};

export const getPropertyById = async (propertyId: string) => {
  const propertySnapshot = await fireStore
    .collection("properties")
    .doc(propertyId)
    .get();
  const propertyData = {
    id: propertySnapshot.id,
    ...propertySnapshot.data(),
  } as Property;
  return propertyData;
};
export const getPropertiesById = async (propertyIds: string[]) => {
  if (!propertyIds.length) {
    return [];
  }
  const propertySnapshot = await fireStore
    .collection("properties")
    .where("__name__", "in", propertyIds)
    .get();
  const propertiesData = propertySnapshot.docs.map((property) => {
    return { id: property.id, ...property.data() } as Property;
  });
  return propertiesData;
};
