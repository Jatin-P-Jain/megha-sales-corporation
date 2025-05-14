import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  endChars = 12
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
export function slugifyPartNumber(partNumber: string) {
  return partNumber
    .trim()
    .toUpperCase()
    .replace(/[^\w\s-]/g, "") // remove punctuation
    .replace(/\s+/g, "-"); // spaces → hyphens
}
