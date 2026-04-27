import admin from "firebase-admin";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";

type ProductDoc = {
  brandId?: string;
  brandName?: string;
  partCategory?: string;
  partNumber?: string;
  partName?: string;
  image?: string;
};

type ImageIssue = {
  productId: string;
  brandId: string;
  brandName: string;
  partCategory: string;
  partNumber: string;
  partName: string;
  imageValue: string;
  imageResolvedUrl: string;
  issueType: "MISSING" | "BROKEN" | "INVALID_URL";
  issueDetails: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
};

const DEFAULT_STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  "https://firebasestorage.googleapis.com/v0/b/megha-sales-corporation.firebasestorage.app/o/";

function resolveImageUrl(imageValue: string): string {
  const raw = imageValue.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${DEFAULT_STORAGE_URL}${encodeURIComponent(raw)}?alt=media`;
}

function resolveBrandId(data: ProductDoc): string {
  if (data.brandId && data.brandId.trim()) return data.brandId.trim();
  if (data.brandName && data.brandName.trim())
    return data.brandName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return "unknown-brand";
}

function resolveBrandName(data: ProductDoc, brandId: string): string {
  if (data.brandName && data.brandName.trim()) return data.brandName.trim();
  return brandId
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

async function checkImageHealth(
  url: string
): Promise<{ ok: boolean; statusCode?: number; contentType?: string }> {
  if (!url) return { ok: false };

  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    if (headRes.ok) {
      const ctype = (headRes.headers.get("content-type") || "").toLowerCase();
      if (ctype.startsWith("image/")) {
        return { ok: true, statusCode: headRes.status, contentType: ctype };
      }
    }

    const getRes = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    if (!getRes.ok) {
      return { ok: false, statusCode: getRes.status };
    }

    const ctype = (getRes.headers.get("content-type") || "").toLowerCase();
    const isImage = ctype.startsWith("image/");
    return { ok: isImage, statusCode: getRes.status, contentType: ctype };
  } catch (error) {
    return { ok: false };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from({ length: Math.max(1, limit) }, () => runner());
  await Promise.all(runners);
  return results;
}

async function createImageAuditReport() {
  const serviceAccountPath = path.join(
    process.cwd(),
    "serviceAccount.prod.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("serviceAccount.prod.json not found in project root.");
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  ) as admin.ServiceAccount;

  const app = admin.initializeApp(
    { credential: admin.credential.cert(serviceAccount) },
    "image-audit-app"
  );
  const db = app.firestore();

  console.log("Scanning Firestore products from production...");
  const snap = await db.collection("products").get();
  console.log(`Products fetched: ${snap.size}`);

  const products = snap.docs.map((doc) => {
    const data = doc.data() as ProductDoc;
    const brandId = resolveBrandId(data);
    const brandName = resolveBrandName(data, brandId);
    const imageRaw = (data.image || "").toString();
    const imageResolvedUrl = resolveImageUrl(imageRaw);

    return {
      productId: doc.id,
      brandId,
      brandName,
      partCategory: (data.partCategory || "").toString(),
      partNumber: (data.partNumber || "").toString(),
      partName: (data.partName || "").toString(),
      imageRaw,
      imageResolvedUrl,
    };
  });

  console.log("Checking image health...");

  const imageIssues: ImageIssue[] = [];

  await runWithConcurrency(products, 12, async (product, index) => {
    if ((index + 1) % 100 === 0 || index === products.length - 1) {
      console.log(`Image check progress: ${index + 1}/${products.length}`);
    }

    if (!product.imageRaw.trim()) {
      imageIssues.push({
        productId: product.productId,
        brandId: product.brandId,
        brandName: product.brandName,
        partCategory: product.partCategory,
        partNumber: product.partNumber,
        partName: product.partName,
        imageValue: product.imageRaw,
        imageResolvedUrl: product.imageResolvedUrl,
        issueType: "MISSING",
        issueDetails: "Image field is completely empty",
        severity: "CRITICAL",
      });
      return product;
    }

    if (!product.imageResolvedUrl) {
      imageIssues.push({
        productId: product.productId,
        brandId: product.brandId,
        brandName: product.brandName,
        partCategory: product.partCategory,
        partNumber: product.partNumber,
        partName: product.partName,
        imageValue: product.imageRaw,
        imageResolvedUrl: product.imageResolvedUrl,
        issueType: "INVALID_URL",
        issueDetails: "Image URL could not be resolved",
        severity: "HIGH",
      });
      return product;
    }

    const result = await checkImageHealth(product.imageResolvedUrl);
    if (!result.ok) {
      const statusDetail = result.statusCode
        ? ` (HTTP ${result.statusCode})`
        : "";
      const typeDetail = result.contentType
        ? ` (Content-Type: ${result.contentType})`
        : "";
      imageIssues.push({
        productId: product.productId,
        brandId: product.brandId,
        brandName: product.brandName,
        partCategory: product.partCategory,
        partNumber: product.partNumber,
        partName: product.partName,
        imageValue: product.imageRaw,
        imageResolvedUrl: product.imageResolvedUrl,
        issueType: "BROKEN",
        issueDetails: `URL is not reachable or not a valid image${statusDetail}${typeDetail}`,
        severity: "HIGH",
      });
    }

    return product;
  });

  console.log("Creating Excel report...");

  const workbook = new ExcelJS.Workbook();
  const appBaseUrl = "https://meghasalescorporation.in";

  // Summary sheet
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 35 },
    { header: "Count", key: "count", width: 15 },
    { header: "Percentage", key: "percentage", width: 15 },
  ];

  const totalProducts = products.length;
  const productsWithIssues = new Set(imageIssues.map((i) => i.productId)).size;
  const missingImages = imageIssues.filter(
    (i) => i.issueType === "MISSING"
  ).length;
  const brokenImages = imageIssues.filter(
    (i) => i.issueType === "BROKEN"
  ).length;
  const invalidUrls = imageIssues.filter(
    (i) => i.issueType === "INVALID_URL"
  ).length;

  const summaryData = [
    {
      metric: "Total Products Scanned",
      count: totalProducts,
      percentage: "100%",
    },
    {
      metric: "Products with Image Issues",
      count: productsWithIssues,
      percentage: `${((productsWithIssues / totalProducts) * 100).toFixed(1)}%`,
    },
    {
      metric: "Total Image Issues",
      count: imageIssues.length,
      percentage: "100%",
    },
    {
      metric: "Missing Images",
      count: missingImages,
      percentage: `${((missingImages / imageIssues.length) * 100).toFixed(1)}%`,
    },
    {
      metric: "Broken/Unreachable Images",
      count: brokenImages,
      percentage: `${((brokenImages / imageIssues.length) * 100).toFixed(1)}%`,
    },
    {
      metric: "Invalid URL Format",
      count: invalidUrls,
      percentage: `${((invalidUrls / imageIssues.length) * 100).toFixed(1)}%`,
    },
  ];

  summarySheet.addRows(summaryData);
  summarySheet.getRow(1).font = { bold: true };

  // All Issues sheet
  const allIssuesSheet = workbook.addWorksheet("All Issues");
  allIssuesSheet.columns = [
    { header: "Severity", key: "severity", width: 12 },
    { header: "Issue Type", key: "issueType", width: 16 },
    { header: "Brand", key: "brandName", width: 20 },
    { header: "Product ID", key: "productId", width: 30 },
    { header: "Category", key: "partCategory", width: 18 },
    { header: "Part Name", key: "partName", width: 30 },
    { header: "Part Number", key: "partNumber", width: 18 },
    { header: "Image Value", key: "imageValue", width: 35 },
    { header: "Resolved URL", key: "imageResolvedUrl", width: 60 },
    { header: "Issue Details", key: "issueDetails", width: 45 },
    { header: "Edit Link", key: "editLink", width: 70 },
  ];

  const sortedIssues = imageIssues.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const allIssuesData = sortedIssues.map((issue) => ({
    ...issue,
    editLink: `${appBaseUrl}/admin-dashboard/edit-product/${issue.brandId}/${issue.productId}`,
  }));

  allIssuesSheet.addRows(allIssuesData);
  allIssuesSheet.getRow(1).font = { bold: true };

  // Color code severity
  for (let i = 2; i <= allIssuesSheet.rowCount; i++) {
    const row = allIssuesSheet.getRow(i);
    const severity = row.getCell("A").value;
    if (severity === "CRITICAL") {
      row.font = { color: { argb: "FFFF0000" } };
    } else if (severity === "HIGH") {
      row.font = { color: { argb: "FFFF9900" } };
    }
  }

  // Add hyperlinks
  for (let i = 2; i <= allIssuesSheet.rowCount; i++) {
    const cell = allIssuesSheet.getCell(`K${i}`);
    const value = String(cell.value || "");
    if (value.startsWith("http")) {
      cell.value = { text: "Edit Product", hyperlink: value };
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }

  // Issues by Type sheet
  const byTypeSheet = workbook.addWorksheet("By Issue Type");
  byTypeSheet.columns = [
    { header: "Issue Type", key: "issueType", width: 20 },
    { header: "Count", key: "count", width: 12 },
    { header: "Percentage", key: "percentage", width: 15 },
  ];

  const issueTypeData = [
    {
      issueType: "Missing Images",
      count: missingImages,
      percentage: `${((missingImages / imageIssues.length) * 100).toFixed(1)}%`,
    },
    {
      issueType: "Broken/Unreachable",
      count: brokenImages,
      percentage: `${((brokenImages / imageIssues.length) * 100).toFixed(1)}%`,
    },
    {
      issueType: "Invalid URL",
      count: invalidUrls,
      percentage: `${((invalidUrls / imageIssues.length) * 100).toFixed(1)}%`,
    },
  ];

  byTypeSheet.addRows(issueTypeData);
  byTypeSheet.getRow(1).font = { bold: true };

  // Issues by Brand sheet
  const byBrandSheet = workbook.addWorksheet("By Brand");
  byBrandSheet.columns = [
    { header: "Brand", key: "brandName", width: 22 },
    { header: "Total Products", key: "totalProducts", width: 15 },
    { header: "Products with Issues", key: "productsWithIssues", width: 18 },
    { header: "Total Issues", key: "totalIssues", width: 14 },
    { header: "Missing", key: "missing", width: 10 },
    { header: "Broken", key: "broken", width: 10 },
    { header: "Invalid URL", key: "invalidUrl", width: 12 },
  ];

  const brandIds = Array.from(new Set(products.map((p) => p.brandId))).sort();
  const brandData = brandIds.map((brandId) => {
    const brandProducts = products.filter((p) => p.brandId === brandId);
    const brandIssues = imageIssues.filter((i) => i.brandId === brandId);
    const productsWithIssues = new Set(brandIssues.map((i) => i.productId))
      .size;

    return {
      brandName: brandProducts[0]?.brandName || brandId,
      totalProducts: brandProducts.length,
      productsWithIssues,
      totalIssues: brandIssues.length,
      missing: brandIssues.filter((i) => i.issueType === "MISSING").length,
      broken: brandIssues.filter((i) => i.issueType === "BROKEN").length,
      invalidUrl: brandIssues.filter((i) => i.issueType === "INVALID_URL")
        .length,
    };
  });

  byBrandSheet.addRows(
    brandData
      .filter((b) => b.totalIssues > 0)
      .sort((a, b) => b.totalIssues - a.totalIssues)
  );
  byBrandSheet.getRow(1).font = { bold: true };

  // Issues by Category sheet
  const byCategorySheet = workbook.addWorksheet("By Category");
  byCategorySheet.columns = [
    { header: "Category", key: "category", width: 25 },
    { header: "Total Products", key: "totalProducts", width: 15 },
    { header: "Products with Issues", key: "productsWithIssues", width: 18 },
    { header: "Total Issues", key: "totalIssues", width: 14 },
    { header: "Missing", key: "missing", width: 10 },
    { header: "Broken", key: "broken", width: 10 },
  ];

  const allCategories = Array.from(
    new Set(products.map((p) => p.partCategory).filter((c) => c.trim()))
  ).sort();
  const categoryData = allCategories.map((cat) => {
    const catProducts = products.filter((p) => p.partCategory === cat);
    const catIssues = imageIssues.filter((i) => i.partCategory === cat);
    const productsWithIssues = new Set(catIssues.map((i) => i.productId)).size;

    return {
      category: cat,
      totalProducts: catProducts.length,
      productsWithIssues,
      totalIssues: catIssues.length,
      missing: catIssues.filter((i) => i.issueType === "MISSING").length,
      broken: catIssues.filter((i) => i.issueType === "BROKEN").length,
    };
  });

  byCategorySheet.addRows(
    categoryData
      .filter((c) => c.totalIssues > 0)
      .sort((a, b) => b.totalIssues - a.totalIssues)
  );
  byCategorySheet.getRow(1).font = { bold: true };

  // Critical Issues sheet
  const criticalSheet = workbook.addWorksheet("Critical Only");
  criticalSheet.columns = [
    { header: "Brand", key: "brandName", width: 20 },
    { header: "Product ID", key: "productId", width: 30 },
    { header: "Category", key: "partCategory", width: 18 },
    { header: "Part Name", key: "partName", width: 30 },
    { header: "Issue Type", key: "issueType", width: 16 },
    { header: "Details", key: "issueDetails", width: 50 },
  ];

  const criticalIssues = imageIssues.filter((i) => i.severity === "CRITICAL");
  criticalSheet.addRows(criticalIssues);
  criticalSheet.getRow(1).font = { bold: true };

  for (let i = 2; i <= criticalSheet.rowCount; i++) {
    criticalSheet.getRow(i).font = { color: { argb: "FFFF0000" } };
  }

  // Write file
  const outputPath = "scripts/firestore/reports/image-audit.xlsx";
  const absoluteOutput = path.resolve(process.cwd(), outputPath);
  const outputDir = path.dirname(absoluteOutput);
  fs.mkdirSync(outputDir, { recursive: true });

  await workbook.xlsx.writeFile(absoluteOutput);

  console.log("\nImage Audit Report Generated");
  console.log(`Output: ${absoluteOutput}`);
  console.log(`Products with Issues: ${productsWithIssues}/${totalProducts}`);
  console.log(`Total Issues: ${imageIssues.length}`);
  console.log(`  - Missing: ${missingImages}`);
  console.log(`  - Broken: ${brokenImages}`);
  console.log(`  - Invalid URL: ${invalidUrls}`);

  await app.delete();
}

createImageAuditReport().catch((error) => {
  console.error("Audit failed:", error);
  process.exitCode = 1;
});
