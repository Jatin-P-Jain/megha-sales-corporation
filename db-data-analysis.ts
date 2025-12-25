import admin from "firebase-admin";
import * as ExcelJS from "exceljs";
import * as path from "path";

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
  allData: any[],
): Promise<BrandVerification> {
  const productsCol = database.collection("products");
  const snapshot = await productsCol.where("brandId", "==", brandId).get();
  const editProductUrlBase =
    "https://meghasalescorporation.in/admin-dashboard/edit-product/";
  const storageUrl =
    "https://firebasestorage.googleapis.com/v0/b/megha-sales-corporation.firebasestorage.app/o/";
  const dbPartIds = new Set<string>();

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
      image?: string;
    };

    const rowData = {
      docId: doc.id,
      brandId: data.brandId || "",
      brandName: data.brandName || "",
      partCategory: data.partCategory || "",
      partNumber: data.partNumber || "",
      partName: data.partName || "",
      isImagePresent: "",
      status: "OK",
      editProductUrl: "",
    };

    dbPartIds.add(doc.id || "");

    const imagePath = data.image as string;
    const imageUrl = `${storageUrl}${encodeURIComponent(imagePath)}?alt=media`;
    const isOk = await isImageOk(imageUrl);
    rowData.isImagePresent = isOk ? "Yes" : "No";
    if (!isOk) {
      rowData.status = "NO_IMAGE";
      rowData.editProductUrl = `${editProductUrlBase}${brandId}/${doc.id}`;
    }
    allData.push(rowData);
  }

  // finish line for this brand
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  console.log(`✔️ Finished ${brandId} (${total} products)`);

  const actualFolders = await getBrandFolders(brandId);
  const noImageProductsSize = allData.filter(
    (d) => d.brandId === brandId && d.status === "NO_IMAGE",
  ).length;

  const expectedFoldersCount = snapshot.docs.length;

  const verification: BrandVerification = {
    brandId,
    brandName: unslugify(brandId),
    totalProducts: snapshot.docs.length,
    noImages: noImageProductsSize,
    okImages: allData.filter((d) => d.brandId === brandId && d.status === "OK")
      .length,
    expectedFolders: expectedFoldersCount,
    actualFolders: actualFolders.size,
    isBrandOk: expectedFoldersCount - actualFolders.size > 0 ? false : true,
    extraFolders: Array.from(actualFolders).filter((pn) => !dbPartIds.has(pn)),
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
  data: any[],
  verifications: BrandVerification[],
) {
  const workbook = new ExcelJS.Workbook();

  const productsSheet = workbook.addWorksheet("Products");
  productsSheet.columns = [
    { header: "Document ID", key: "docId", width: 25 },
    { header: "Brand ID", key: "brandId", width: 15 },
    { header: "Brand Name", key: "brandName", width: 15 },
    { header: "Part Category", key: "partCategory", width: 15 },
    { header: "Part Number", key: "partNumber", width: 25 },
    { header: "Part Name", key: "partName", width: 20 },
    { header: "Image Available?", key: "isImagePresent", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Edit URL", key: "editProductUrl", width: 40 },
  ];
  productsSheet.addRows(data);

  productsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      const matchCell = row.getCell(7);
      if (matchCell.value === "No") {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEBEE" },
        };
      }
    }
  });

  productsSheet.getRow(1).font = { bold: true };
  productsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE3F2FD" },
  };

  const verificationSheet = workbook.addWorksheet("Brand Verification");
  verificationSheet.columns = [
    { header: "Brand ID", key: "brandId", width: 15 },
    { header: "Brand Name", key: "brandName", width: 25 },
    { header: "Total Products", key: "totalProducts", width: 15 },
    { header: "OK Images", key: "okImages", width: 15 },
    { header: "NO Images", key: "noImages", width: 15 },
    { header: "Expected Folders", key: "expectedFolders", width: 18 },
    { header: "Actual Folders", key: "actualFolders", width: 18 },
    { header: "Brand Status", key: "isBrandOk", width: 30 },
    { header: "Extra Folders", key: "extraFolders", width: 10 },
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

  verificationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      const matchCell = row.getCell(7);
      if (matchCell.value === "❌") {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEBEE" },
        };
      }
    }
  });

  verificationSheet.getRow(1).font = { bold: true };
  verificationSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE3F2FD" },
  };

  const filePath = path.join(process.cwd(), OUTPUT_FILE);
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Excel report saved: ${filePath}`);
}

async function main() {
  const allData: any[] = [];
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
