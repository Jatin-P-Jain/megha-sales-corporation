import admin from "firebase-admin";
import * as ExcelJS from "exceljs";
import * as path from "path";
import { ProductSize, ProductStatus } from "@/types/product";

function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) =>
      word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : "",
    )
    .join(" ");
}

const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./serviceAccount.prod.json")),
  },
  "prodApp",
);

const database = sourceApp.firestore();
const bucket = sourceApp
  .storage()
  .bucket("megha-sales-corporation.firebasestorage.app");

const OUTPUT_FILE = "products-report.xlsx";

console.log("✅ App initialized!");

const brands = [
  "autokoi",
  "accurub",
  "ask",
  "acey-aepl",
  "bulldog",
  "ktek",
  "mansarovar",
  "nxt",
  "orbit",
  "super-circle",
  "technix",
];

async function isImageOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    return contentType.startsWith("image/");
  } catch (e) {
    console.error("Error checking image:", url, e);
    return false;
  }
}

async function getBrandFolders(brandId: string): Promise<Set<string>> {
  try {
    const [files] = await bucket.getFiles({ prefix: `products/${brandId}/` });
    const folders = new Set<string>();

    for (const file of files) {
      const pathParts = file.name.split("/");
      if (
        pathParts.length >= 4 &&
        pathParts[0] === "products" &&
        pathParts[1] === brandId
      ) {
        const partNumber = pathParts[2];
        folders.add(partNumber);
      }
    }

    console.log(`\n📁 Found ${folders.size} folders for brand ${brandId}`);
    return folders;
  } catch (error) {
    console.error(`❌ Error listing folders for ${brandId}:`, error);
    return new Set();
  }
}

interface BrandVerification {
  brandId: string;
  brandName: string;
  totalProducts: number;
  noImages: number;
  okImages: number;
  expectedFolders: number;
  actualFolders: number;
  isBrandOk: boolean;
  extraFolders: string[];
}

// Each Excel row (1 product can become N rows if it has sizes)
type ProductExcelRow = {
  docId: string;
  brandId: string;
  brandName: string;
  partCategory: string;
  partNumber: string;
  partName: string;

  vehicleCompany: string;
  vehicleNames: string;

  hasSizes: boolean;
  samePriceForAllSizes: boolean;

  rowType: "PRODUCT" | "SIZE";
  size: string;

  price: number;
  discount: number;
  gst: number;

  isImagePresent: "Yes" | "No";
  status: "OK" | "NO_IMAGE";
  editProductUrl: string;
};

function joinForExcel(values: unknown): string {
  if (!values) return "";
  if (Array.isArray(values)) return values.filter(Boolean).join(", ");
  return String(values);
}

// helper: inline progress for a loop
function printInlineProgress(prefix: string, current: number, total: number) {
  const percentage = total === 0 ? 100 : Math.floor((current / total) * 100);
  const text = `${prefix} ${current}/${total} (${percentage}%)`;
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(text);
}

async function processBrand(
  brandId: string,
  allData: ProductExcelRow[],
): Promise<BrandVerification> {
  const productsCol = database.collection("products");
  const snapshot = await productsCol.where("brandId", "==", brandId).get();

  const editProductUrlBase =
    "https://meghasalescorporation.in/admin-dashboard/edit-product/";
  const storageUrl =
    "https://firebasestorage.googleapis.com/v0/b/megha-sales-corporation.firebasestorage.app/o/";

  // IMPORTANT: your storage folder names appear to be docIds (doc.id), not partNumber.
  const dbFolderIds = new Set<string>();

  const total = snapshot.docs.length;
  console.log(`\n🔄 Processing ${brandId}: ${total} products`);

  let index = 0;
  for (const doc of snapshot.docs) {
    index++;
    printInlineProgress(`   ➜ ${brandId}`, index, total);

    const data = doc.data() as {
      id?: string;
      brandId?: string;
      brandName?: string;
      partNumber?: string;
      partName?: string;
      partCategory?: string;

      vehicleCompany?: string;
      vehicleNames?: string[];

      price?: number;
      discount?: number;
      gst?: number;

      hasSizes?: boolean;
      sizes?: ProductSize[];
      samePriceForAllSizes?: boolean;

      status: ProductStatus;
      additionalDetails?: string;

      image?: string;
    };

    dbFolderIds.add(doc.id);

    const imagePath = (data.image as string) || "";
    const imageUrl = imagePath
      ? `${storageUrl}${encodeURIComponent(imagePath)}?alt=media`
      : "";

    const imageOk = imageUrl ? await isImageOk(imageUrl) : false;

    const common = {
      docId: doc.id,
      brandId: data.brandId || "",
      brandName: data.brandName || "",
      partCategory: data.partCategory || "",
      partNumber: data.partNumber || "",
      partName: data.partName || "",

      vehicleCompany: data.vehicleCompany || "",
      vehicleNames: joinForExcel(data.vehicleNames || []),

      hasSizes: Boolean(data.hasSizes),
      samePriceForAllSizes: Boolean(data.samePriceForAllSizes),

      isImagePresent: imageOk ? ("Yes" as const) : ("No" as const),
      status: imageOk ? ("OK" as const) : ("NO_IMAGE" as const),
      editProductUrl: `${editProductUrlBase}${brandId}/${doc.id}`, // same for size rows too
    };

    const basePrice = data.price || 0;
    const baseDiscount = data.discount || 0;
    const baseGst = data.gst || 0;

    const sizes = (data.sizes || []) as ProductSize[];

    // If product has sizes -> create one row per size
    if (common.hasSizes && sizes.length > 0) {
      for (const s of sizes) {
        const useBase = common.samePriceForAllSizes;

        allData.push({
          ...common,
          rowType: "SIZE",
          size: s.size || "",
          price: useBase ? basePrice : (s.price ?? basePrice),
          discount: useBase ? baseDiscount : (s.discount ?? baseDiscount),
          gst: useBase ? baseGst : (s.gst ?? baseGst),
        });
      }
    } else {
      // No sizes -> single product row
      allData.push({
        ...common,
        rowType: "PRODUCT",
        size: "",
        price: basePrice,
        discount: baseDiscount,
        gst: baseGst,
      });
    }
  }

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  console.log(`✔️ Finished ${brandId} (${total} products)`);

  const actualFolders = await getBrandFolders(brandId);

  const noImageCount = allData.filter(
    (d) => d.brandId === brandId && d.status === "NO_IMAGE",
  ).length;

  const okImageCount = allData.filter(
    (d) => d.brandId === brandId && d.status === "OK",
  ).length;

  // Expected folders is still based on number of products in DB (same as your original intent)
  const expectedFoldersCount = snapshot.docs.length;

  const extraFolders = Array.from(actualFolders).filter(
    (folderName) => !dbFolderIds.has(folderName),
  );

  const verification: BrandVerification = {
    brandId,
    brandName: unslugify(brandId),
    totalProducts: snapshot.docs.length,
    noImages: noImageCount,
    okImages: okImageCount,
    expectedFolders: expectedFoldersCount,
    actualFolders: actualFolders.size,
    isBrandOk: expectedFoldersCount - actualFolders.size > 0 ? false : true,
    extraFolders,
  };

  console.log(`📊 ${brandId} Verification:
    Total Products: ${verification.totalProducts}
    Broken Images: ${verification.noImages}
    Expected Folders: ${verification.expectedFolders}
    Actual Folders: ${verification.actualFolders}
    Brand Status: ${verification.isBrandOk ? "✅" : "❌"}
    Extra Folders: ${verification.extraFolders.join(" ,")}`);

  return verification;
}

async function generateExcelReport(
  data: ProductExcelRow[],
  verifications: BrandVerification[],
) {
  const workbook = new ExcelJS.Workbook();

  // -------------------- Products sheet --------------------
  const productsSheet = workbook.addWorksheet("Products");

  productsSheet.columns = [
    { header: "Document ID", key: "docId", width: 25 },
    { header: "Brand ID", key: "brandId", width: 15 },
    { header: "Brand Name", key: "brandName", width: 18 },
    { header: "Part Category", key: "partCategory", width: 18 },
    { header: "Part Number", key: "partNumber", width: 22 },
    { header: "Part Name", key: "partName", width: 22 },

    { header: "Vehicle Company", key: "vehicleCompany", width: 22 },
    { header: "Vehicle Names", key: "vehicleNames", width: 35 },

    { header: "Has Sizes?", key: "hasSizes", width: 12 },
    {
      header: "Same Price For All Sizes",
      key: "samePriceForAllSizes",
      width: 24,
    },

    // this clearly marks size rows
    { header: "Row Type", key: "rowType", width: 12 },
    { header: "Size", key: "size", width: 14 },

    { header: "Price", key: "price", width: 12 },
    { header: "Discount", key: "discount", width: 12 },
    { header: "GST", key: "gst", width: 10 },

    { header: "Image Available?", key: "isImagePresent", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Edit URL", key: "editProductUrl", width: 45 },
  ];

  // addRows works with objects when keys match the column keys [web:5]
  productsSheet.addRows(data);

  // style header
  productsSheet.getRow(1).font = { bold: true };
  productsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE3F2FD" },
  };

  // highlight missing images + visually mark size rows
  const imageColNum = productsSheet.getColumn("isImagePresent").number;
  const rowTypeColNum = productsSheet.getColumn("rowType").number;

  productsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const imageCell = row.getCell(imageColNum);
    const rowTypeCell = row.getCell(rowTypeColNum);

    if (imageCell.value === "No") {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEBEE" },
      };
    }

    if (rowTypeCell.value === "SIZE") {
      // light grey row fill to identify size rows separately
      row.fill = row.fill || {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF5F5F5" },
      };
      rowTypeCell.font = { bold: true };
    }
  });

  // -------------------- Brand Verification sheet --------------------
  const verificationSheet = workbook.addWorksheet("Brand Verification");
  verificationSheet.columns = [
    { header: "Brand ID", key: "brandId", width: 15 },
    { header: "Brand Name", key: "brandName", width: 25 },
    { header: "Total Products", key: "totalProducts", width: 15 },
    { header: "OK Images", key: "okImages", width: 15 },
    { header: "NO Images", key: "noImages", width: 15 },
    { header: "Expected Folders", key: "expectedFolders", width: 18 },
    { header: "Actual Folders", key: "actualFolders", width: 18 },
    { header: "Brand Status", key: "isBrandOk", width: 14 },
    { header: "Extra Folders", key: "extraFolders", width: 35 },
  ];

  verifications.forEach((v) => {
    verificationSheet.addRow({
      brandId: v.brandId,
      brandName: v.brandName,
      totalProducts: v.totalProducts,
      okImages: v.okImages,
      noImages: v.noImages,
      expectedFolders: v.expectedFolders,
      actualFolders: v.actualFolders,
      isBrandOk: v.isBrandOk ? "✅" : "❌",
      extraFolders: v.extraFolders.join(" ,"),
    });
  });

  verificationSheet.getRow(1).font = { bold: true };
  verificationSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE3F2FD" },
  };

  // highlight bad brands
  const statusColNum = verificationSheet.getColumn("isBrandOk").number;
  verificationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const statusCell = row.getCell(statusColNum);
    if (statusCell.value === "❌") {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEBEE" },
      };
    }
  });

  const filePath = path.join(process.cwd(), OUTPUT_FILE);
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Excel report saved: ${filePath}`);
}

async function main() {
  const allData: ProductExcelRow[] = [];
  const verifications: BrandVerification[] = [];

  const totalBrands = brands.length;
  let brandIndex = 0;

  for (const brandId of brands) {
    brandIndex++;
    console.log(`\nBrand ${brandIndex}/${totalBrands}: ${brandId}`);
    const verification = await processBrand(brandId, allData);
    verifications.push(verification);
  }

  await generateExcelReport(allData, verifications);

  console.log(`\n🎉 COMPLETE! Check ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
