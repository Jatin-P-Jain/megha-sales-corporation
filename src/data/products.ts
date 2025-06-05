import "server-only";
import { fireStore, getTotalPages } from "@/firebase/server";
import { Product, ProductStatus } from "@/types/product";
import { CartProduct } from "@/types/cartProduct";

type GetPropertiesOptions = {
  filters?: {
    brandId: string | null;
    status: ProductStatus[] | null;
    partCategory: string[] | null;
  };
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

export const getProducts = async (options?: GetPropertiesOptions) => {
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;

  const { status, partCategory, brandId } = options?.filters || {};

  let productsQuery = fireStore
    .collection("products")
    .orderBy("updated", "desc");
  if (brandId) {
    productsQuery = productsQuery.where("brandId", "==", brandId);
  }
  if (Array.isArray(status) && status.length > 0) {
    productsQuery = productsQuery.where("status", "in", status);
  }
  if (Array.isArray(partCategory) && partCategory.length > 0) {
    productsQuery = productsQuery.where("partCategory", "in", partCategory);
  }

  const totals = await getTotalPages(productsQuery, pageSize);

  const { totalPages, totalItems } = totals;

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

  return { data: products, totalPages: totalPages, totalItems: totalItems };
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
    brandId: rawProductData.brandId as string,
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
export const getProductsById = async (productIds: string[]) => {
  if (!productIds.length) {
    return [];
  }
  const propertySnapshot = await fireStore
    .collection("products")
    .where("__name__", "in", productIds)
    .get();
  const productsData = propertySnapshot.docs.map((property) => {
    const rawProductData = property.data();
    const product: Omit<CartProduct, "quantity"> = {
      id: property.id,
      brandName: rawProductData.brandName as string,
      brandId: rawProductData.brandId as string,
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
  });
  return productsData;
};
