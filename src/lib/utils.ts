import { CartProduct } from "@/types/cartProduct";
import { Product, ProductStatus } from "@/types/product";
import { clsx, type ClassValue } from "clsx";
import { DocumentData } from "firebase/firestore";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PAGE_SIZE: number = 10;
// utils/fileType.ts
export type FileType = "image" | "video" | "pdf" | "excel" | "word" | "generic";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "svg", "bmp", "webp", "tiff"];
const VIDEO_EXTS = ["mp4", "mov", "avi", "mkv", "webm"];
const EXCEL_EXTS = ["xls", "xlsx", "csv"];
const WORD_EXTS = ["doc", "docx"];

export function getFileType(fileName: string): FileType {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (EXCEL_EXTS.includes(ext)) return "excel";
  if (WORD_EXTS.includes(ext)) return "word";
  return "generic";
}

export function truncateMiddle(
  str?: string,
  maxLength = 30,
  startChars = 10,
  endChars = 12,
): string | undefined {
  if (!str || str?.length <= maxLength) return str;
  const start = str?.slice(0, startChars);
  const end = str?.slice(str.length - endChars);
  return `${start}…${end}`;
}

export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove punctuation
    .replace(/\s+/g, "-"); // spaces → hyphens
}
export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) =>
      word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : "",
    )
    .join(" ");
}

export function slugifyPartNumber(partNumber: string) {
  return partNumber
    .trim()
    .toUpperCase()
    .replace(/[^\w\s-]/g, "") // remove punctuation
    .replace(/\s+/g, "-"); // spaces → hyphens
}

/**
 * Formats a number or numeric‐string as Indian rupees, e.g. "1234567.8" → "₹12,34,567.80"
 */
export function formatINR(value?: number | string): string {
  if (!value) {
    return "";
  }
  // 1) Coerce to a number (strip out any commas)
  const num =
    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) {
    // if it wasn’t a valid number, just return the original string
    return String(value);
  }

  // 2) Use Intl.NumberFormat with the “en-IN” locale and INR currency
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// src/lib/dateUtils.ts

/**
 * Format an ISO timestamp (or Date) into `DD-MMM-YYYY hh:mm AM/PM`
 * e.g. `"2025-05-28T14:06:06.926Z"` → `"28-May-2025 02:06 PM"`
 */
export function formatDateTime(input?: string): string {
  if (!input) {
    return "";
  }
  const date = new Date(input);

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  hours = hours; // convert 0 → 12
  const hh = String(hours).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year - 2000}, ${hh}:${mm}`;
}

export const organizeCartProducts = (cartProducts: CartProduct[]) => {
  const grouped = cartProducts.reduce(
    (acc, item) => {
      const key = item.id ?? "";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, CartProduct[]>,
  );

  const sortedAndFlattened = Object.values(grouped)
    .reverse()
    .map((group) =>
      group.sort((a, b) => {
        const sizeA = a.selectedSize?.toLowerCase() ?? "";
        const sizeB = b.selectedSize?.toLowerCase() ?? "";
        return sizeA.localeCompare(sizeB);
      }),
    )
    .flat();

  return sortedAndFlattened;
};

export const mapProductToClientProduct = (data: DocumentData) => {
  const rawProductData = data;
  const product: Product = {
    id: data.id,
    brandName: rawProductData.brandName as string,
    brandId: rawProductData.brandId as string,
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
    status: rawProductData.status as ProductStatus,
    hasSizes: rawProductData.hasSizes as boolean,
    samePriceForAllSizes: rawProductData.samePriceForAllSizes as boolean,
    sizes: rawProductData.sizes as {
      size: string;
      price?: number;
      discount?: number;
      gst?: number;
    }[],
    image: rawProductData.image as string | undefined,
  };
  return product;
};
