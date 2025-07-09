import "server-only";
import { fireStore, getTotalPages } from "@/firebase/server";
import { Product, ProductStatus } from "@/types/product";

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

  // 🔁 Only use startAfter if page > 1
  if (page > 1) {
    const skipSnapshot = await productsQuery
      .limit((page - 1) * pageSize)
      .get();

    const lastVisible = skipSnapshot.docs.at(-1);
    if (lastVisible) {
      productsQuery = productsQuery.startAfter(lastVisible);
    }
  }

  const productsSnapshot = await productsQuery.limit(pageSize).get();

  const productsData = productsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const product: Product = {
      id: doc.id,
      brandName: data.brandName,
      brandId: data.brandId,
      companyName: data.companyName,
      vehicleCompany: data.vehicleCompany,
      vehicleNames: data.vehicleNames,
      partCategory: data.partCategory,
      partNumber: data.partNumber,
      partName: data.partName,
      price: data.price,
      discount: data.discount,
      gst: data.gst,
      stock: data.stock,
      status: data.status,
      hasSizes: data.hasSizes,
      samePriceForAllSizes: data.samePriceForAllSizes,
      sizes: data.sizes,
      image: data.image,
    };
    return product;
  });

  return {
    data: productsData,
    totalPages,
    totalItems,
  };
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
    vehicleNames: rawProductData.vehicleNames as string[],
    partCategory: rawProductData.partCategory as string,
    partNumber: rawProductData.partNumber as string,
    partName: rawProductData.partName as string,
    price: rawProductData.price as number,
    discount: rawProductData.discount as number,
    gst: rawProductData.gst as number,
    stock: rawProductData.stock as number,
    hasSizes: rawProductData.hasSizes as boolean,
    samePriceForAllSizes: rawProductData.samePriceForAllSizes as boolean,
    sizes: rawProductData.sizes as {
      size: string;
      price: number;
      discount?: number;
      gst?: number;
    }[],
    status: rawProductData.status as ProductStatus,
    image: rawProductData.image as string | undefined,
  };

  return product;
};
