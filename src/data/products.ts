import "server-only";
import { fireStore, getTotalPages } from "@/firebase/server";
import { Product, ProductStatus } from "@/types/product";
import { Property } from "@/types/property";

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

  const { status } = options?.filters || {};

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
  if (Array.isArray(status) && status.length > 0) {
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

export const getProductById = async (productId: string) => {
  const productSnapshot = await fireStore
    .collection("products")
    .doc(productId)
    .get();
  const rawProductData = productSnapshot.data()!;

  // build a pure‐JS object matching your Product type
  const product: Product = {
    id: productSnapshot.id,
    brandName: rawProductData.brandName as string,
    companyName: rawProductData.companyName as string,
    vehicleCompany: rawProductData.vehicleCompany as string,
    vehicleName: rawProductData.vehicleName as string[],
    partCategory: rawProductData.partCategory as string,
    partNumber: rawProductData.partNumber as string,
    partName: rawProductData.partName as string,
    price: rawProductData.price as number,
    discount: rawProductData.discount as number,
    gst: rawProductData.gst as number,
    stock: rawProductData.stock as number,
    status: rawProductData.status as ProductStatus,
    image: rawProductData.image as string | undefined,
  };

  return product;
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
