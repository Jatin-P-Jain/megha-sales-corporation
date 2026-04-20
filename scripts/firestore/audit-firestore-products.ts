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
  companyName?: string;
  vehicleCompany?: string;
  additionalDetails?: string;
  image?: string;
};

type ProductIssueRow = {
  brandId: string;
  brandName: string;
  productId: string;
  partCategory: string;
  partNumber: string;
  partName: string;
  issueType: string;
  issueDetails: string;
  imageValue: string;
  imageResolvedUrl: string;
  editLink: string;
};

type BrandSummary = {
  brandId: string;
  brandName: string;
  totalProducts: number;
  typoFlaggedProducts: number;
  missingImageProducts: number;
  brokenImageProducts: number;
  productsWithAnyIssue: number;
};

type ProductAudit = {
  productId: string;
  brandId: string;
  brandName: string;
  partCategory: string;
  partNumber: string;
  partName: string;
  imageRaw: string;
  imageResolvedUrl: string;
  typoIssues: string[];
  imageIssues: string[];
};

const DEFAULT_APP_BASE_URL = "https://meghasalescorporation.in";
const DEFAULT_STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  "https://firebasestorage.googleapis.com/v0/b/megha-sales-corporation.firebasestorage.app/o/";

const COMMON_TYPO_PATTERNS: Array<{ re: RegExp; message: string }> = [
  { re: /\bteh\b/gi, message: "Possible typo: 'teh'" },
  { re: /\brecieve\b/gi, message: "Possible typo: 'recieve'" },
  { re: /\bseprator\b/gi, message: "Possible typo: 'seprator'" },
  { re: /\bgaur?d\b/gi, message: "Possible typo: 'guard'" },
  { re: /\bvehical\b/gi, message: "Possible typo: 'vehicle'" },
  { re: /\bbrea?k\b/gi, message: "Check spelling around 'break/brake'" },
  { re: /\babsorberr\b/gi, message: "Possible typo: absorber" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unslugify(slug: string): string {
  if (!slug) return "Unknown";
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function sanitizeSheetName(name: string): string {
  const safe = name.replace(/[\\\/?*\[\]:]/g, " ").trim();
  return safe.length > 31 ? safe.slice(0, 31) : safe || "Unknown";
}

function resolveBrandId(data: ProductDoc): string {
  if (data.brandId && data.brandId.trim()) return data.brandId.trim();
  if (data.brandName && data.brandName.trim()) return slugify(data.brandName);
  return "unknown-brand";
}

function resolveBrandName(data: ProductDoc, brandId: string): string {
  if (data.brandName && data.brandName.trim()) return data.brandName.trim();
  return unslugify(brandId);
}

function resolveImageUrl(imageValue: string): string {
  const raw = imageValue.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${DEFAULT_STORAGE_URL}${encodeURIComponent(raw)}?alt=media`;
}

function collectTextTypos(fieldLabel: string, value: string, out: string[]) {
  const text = value || "";
  if (!text) return;

  if (text !== text.trim()) {
    out.push(`${fieldLabel}: leading/trailing whitespace`);
  }
  if (/\s{2,}/.test(text)) {
    out.push(`${fieldLabel}: repeated whitespace`);
  }
  if (/([a-zA-Z])\1\1/.test(text)) {
    out.push(`${fieldLabel}: repeated character sequence`);
  }
  if (/[!?.,-]{3,}/.test(text)) {
    out.push(`${fieldLabel}: repeated punctuation`);
  }

  for (const pattern of COMMON_TYPO_PATTERNS) {
    if (pattern.re.test(text)) {
      out.push(`${fieldLabel}: ${pattern.message}`);
    }
  }
}

function detectPotentialTypos(product: ProductDoc): string[] {
  const issues: string[] = [];

  const partName = (product.partName || "").trim();
  const partNumber = (product.partNumber || "").trim();

  if (!partName) {
    issues.push("partName: missing value");
  } else if (partName.length < 3) {
    issues.push("partName: very short value");
  }

  if (!partNumber) {
    issues.push("partNumber: missing value");
  }

  collectTextTypos("partName", product.partName || "", issues);
  collectTextTypos("partNumber", product.partNumber || "", issues);
  collectTextTypos("partCategory", product.partCategory || "", issues);
  collectTextTypos("vehicleCompany", product.vehicleCompany || "", issues);
  collectTextTypos("companyName", product.companyName || "", issues);
  collectTextTypos(
    "additionalDetails",
    product.additionalDetails || "",
    issues
  );

  return Array.from(new Set(issues));
}

async function checkImageHealth(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    if (headRes.ok) {
      const ctype = (headRes.headers.get("content-type") || "").toLowerCase();
      if (ctype.startsWith("image/")) return true;
    }

    const getRes = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    if (!getRes.ok) return false;

    const ctype = (getRes.headers.get("content-type") || "").toLowerCase();
    return ctype.startsWith("image/");
  } catch {
    return false;
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

function parseCliArgs() {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (const arg of args) {
    const [key, ...rest] = arg.split("=");
    if (!key.startsWith("--")) continue;
    map.set(key.slice(2), rest.join("=") || "true");
  }

  const appBaseUrl = (map.get("app-base-url") || DEFAULT_APP_BASE_URL).replace(
    /\/$/,
    ""
  );

  const outputPath =
    map.get("output") ||
    "scripts/firestore/reports/firestore-product-audit.xlsx";
  const checkBrokenImages = (map.get("check-images") || "true") !== "false";

  const concurrencyRaw = Number(map.get("image-concurrency") || "12");
  const imageConcurrency =
    Number.isFinite(concurrencyRaw) && concurrencyRaw > 0
      ? Math.floor(concurrencyRaw)
      : 12;

  return {
    appBaseUrl,
    outputPath,
    checkBrokenImages,
    imageConcurrency,
  };
}

async function createAuditReport() {
  const { appBaseUrl, outputPath, checkBrokenImages, imageConcurrency } =
    parseCliArgs();

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
    "product-audit-app"
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
      typoIssues: detectPotentialTypos(data),
      imageIssues: [] as string[],
    } as ProductAudit;
  });

  if (checkBrokenImages) {
    console.log("Checking image health...");
    await runWithConcurrency(
      products,
      imageConcurrency,
      async (product, index) => {
        if ((index + 1) % 100 === 0 || index === products.length - 1) {
          console.log(`Image check progress: ${index + 1}/${products.length}`);
        }

        if (!product.imageRaw.trim()) {
          product.imageIssues.push("IMAGE_MISSING: image field is empty");
          return product;
        }

        if (!product.imageResolvedUrl) {
          product.imageIssues.push(
            "IMAGE_MISSING: image URL could not be resolved"
          );
          return product;
        }

        const ok = await checkImageHealth(product.imageResolvedUrl);
        if (!ok) {
          product.imageIssues.push(
            "IMAGE_BROKEN: URL is not reachable or not an image"
          );
        }

        return product;
      }
    );
  } else {
    for (const product of products) {
      if (!product.imageRaw.trim()) {
        product.imageIssues.push("IMAGE_MISSING: image field is empty");
      }
    }
  }

  const withIssues = products.filter(
    (p) => p.typoIssues.length > 0 || p.imageIssues.length > 0
  );

  const issueRows: ProductIssueRow[] = [];
  for (const product of withIssues) {
    const editLink = `${appBaseUrl}/admin-dashboard/edit-product/${product.brandId}/${product.productId}`;

    for (const typo of product.typoIssues) {
      issueRows.push({
        brandId: product.brandId,
        brandName: product.brandName,
        productId: product.productId,
        partCategory: product.partCategory,
        partNumber: product.partNumber,
        partName: product.partName,
        issueType: "TYPO",
        issueDetails: typo,
        imageValue: product.imageRaw,
        imageResolvedUrl: product.imageResolvedUrl,
        editLink,
      });
    }

    for (const imageIssue of product.imageIssues) {
      const issueType = imageIssue.startsWith("IMAGE_BROKEN")
        ? "IMAGE_BROKEN"
        : "IMAGE_MISSING";

      issueRows.push({
        brandId: product.brandId,
        brandName: product.brandName,
        productId: product.productId,
        partCategory: product.partCategory,
        partNumber: product.partNumber,
        partName: product.partName,
        issueType,
        issueDetails: imageIssue,
        imageValue: product.imageRaw,
        imageResolvedUrl: product.imageResolvedUrl,
        editLink,
      });
    }
  }

  issueRows.sort((a, b) => {
    if (a.brandId !== b.brandId) return a.brandId.localeCompare(b.brandId);
    if (a.partCategory !== b.partCategory) {
      return a.partCategory.localeCompare(b.partCategory);
    }
    if (a.partNumber !== b.partNumber)
      return a.partNumber.localeCompare(b.partNumber);
    return a.issueType.localeCompare(b.issueType);
  });

  const brandIds = Array.from(new Set(products.map((p) => p.brandId))).sort();

  const brandSummaries: BrandSummary[] = brandIds.map((brandId) => {
    const inBrand = products.filter((p) => p.brandId === brandId);
    const inBrandWithIssues = withIssues.filter((p) => p.brandId === brandId);

    const typoCount = inBrandWithIssues.filter(
      (p) => p.typoIssues.length > 0
    ).length;
    const missingImageCount = inBrandWithIssues.filter((p) =>
      p.imageIssues.some((i) => i.startsWith("IMAGE_MISSING"))
    ).length;
    const brokenImageCount = inBrandWithIssues.filter((p) =>
      p.imageIssues.some((i) => i.startsWith("IMAGE_BROKEN"))
    ).length;

    return {
      brandId,
      brandName: inBrand[0]?.brandName || unslugify(brandId),
      totalProducts: inBrand.length,
      typoFlaggedProducts: typoCount,
      missingImageProducts: missingImageCount,
      brokenImageProducts: brokenImageCount,
      productsWithAnyIssue: inBrandWithIssues.length,
    };
  });

  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Brand ID", key: "brandId", width: 22 },
    { header: "Brand Name", key: "brandName", width: 24 },
    { header: "Total Products", key: "totalProducts", width: 16 },
    { header: "Products With Typos", key: "typoFlaggedProducts", width: 20 },
    {
      header: "Products Missing Image",
      key: "missingImageProducts",
      width: 24,
    },
    {
      header: "Products With Broken Image",
      key: "brokenImageProducts",
      width: 26,
    },
    {
      header: "Products With Any Issue",
      key: "productsWithAnyIssue",
      width: 22,
    },
  ];
  summarySheet.addRows(brandSummaries);
  summarySheet.getRow(1).font = { bold: true };

  const allIssuesSheet = workbook.addWorksheet("All Issues");
  allIssuesSheet.columns = [
    { header: "Brand ID", key: "brandId", width: 22 },
    { header: "Brand Name", key: "brandName", width: 24 },
    { header: "Category", key: "partCategory", width: 20 },
    { header: "Part Number", key: "partNumber", width: 24 },
    { header: "Part Name", key: "partName", width: 28 },
    { header: "Product ID", key: "productId", width: 30 },
    { header: "Issue Type", key: "issueType", width: 14 },
    { header: "Issue Details", key: "issueDetails", width: 52 },
    { header: "Image Value", key: "imageValue", width: 40 },
    { header: "Resolved Image URL", key: "imageResolvedUrl", width: 60 },
    { header: "Edit Link", key: "editLink", width: 66 },
  ];
  allIssuesSheet.addRows(issueRows);
  allIssuesSheet.getRow(1).font = { bold: true };

  for (let i = 2; i <= allIssuesSheet.rowCount; i += 1) {
    const cell = allIssuesSheet.getCell(`K${i}`);
    const value = String(cell.value || "");
    if (value.startsWith("http")) {
      cell.value = { text: value, hyperlink: value };
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }

  for (const brandId of brandIds) {
    const rows = issueRows.filter((r) => r.brandId === brandId);
    if (rows.length === 0) continue;

    const brandSheet = workbook.addWorksheet(
      sanitizeSheetName(`${brandId}-issues`)
    );

    brandSheet.columns = [
      { header: "Category", key: "partCategory", width: 20 },
      { header: "Part Number", key: "partNumber", width: 24 },
      { header: "Part Name", key: "partName", width: 28 },
      { header: "Product ID", key: "productId", width: 30 },
      { header: "Issue Type", key: "issueType", width: 14 },
      { header: "Issue Details", key: "issueDetails", width: 52 },
      { header: "Image Value", key: "imageValue", width: 40 },
      { header: "Resolved Image URL", key: "imageResolvedUrl", width: 60 },
      { header: "Edit Link", key: "editLink", width: 66 },
    ];

    brandSheet.addRows(rows);
    brandSheet.getRow(1).font = { bold: true };

    for (let i = 2; i <= brandSheet.rowCount; i += 1) {
      const cell = brandSheet.getCell(`I${i}`);
      const value = String(cell.value || "");
      if (value.startsWith("http")) {
        cell.value = { text: value, hyperlink: value };
        cell.font = { color: { argb: "FF0563C1" }, underline: true };
      }
    }
  }

  const absoluteOutput = path.resolve(process.cwd(), outputPath);
  const outputDir = path.dirname(absoluteOutput);
  fs.mkdirSync(outputDir, { recursive: true });

  await workbook.xlsx.writeFile(absoluteOutput);

  console.log("\nAudit complete.");
  console.log(`Output file: ${absoluteOutput}`);
  console.log(`Total products scanned: ${products.length}`);
  console.log(`Products with any issue: ${withIssues.length}`);
  console.log(`Total issue rows: ${issueRows.length}`);

  await app.delete();
}

createAuditReport().catch((error) => {
  console.error("Audit failed:", error);
  process.exitCode = 1;
});
