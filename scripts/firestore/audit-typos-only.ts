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

type TypoIssue = {
  productId: string;
  brandId: string;
  brandName: string;
  partCategory: string;
  partNumber: string;
  partName: string;
  field: string;
  originalValue: string;
  issueType: string;
  issueDescription: string;
  suggestedFix?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

// Automotive terminology dictionary
const AUTOMOTIVE_TERMS = {
  brake: ["brake", "brak", "break", "brakes", "braking"],
  clutch: ["clutch", "clucth", "clutches"],
  wheel: ["wheel", "wheal", "wheeel", "wheels"],
  suspension: ["suspension", "suspention", "supsension"],
  transmission: ["transmission", "transmision", "trasmission"],
  engine: ["engine", "engin", "engne"],
  gearbox: ["gearbox", "gear-box", "gearboxes"],
  assembly: ["assembly", "asembly", "assemblay", "assemblies"],
  bearing: ["bearing", "bering", "bearning", "bearings"],
  bushing: ["bushing", "bushings"],
  gasket: ["gasket", "gaskets"],
  seal: ["seal", "seals"],
  bolt: ["bolt", "bolts"],
  nut: ["nut", "nuts"],
  shock: ["shock", "shocks", "shockers", "shocker"],
  absorber: ["absorber", "absober", "absorbers"],
  spring: ["spring", "springs"],
  alternator: ["alternator", "alternators"],
  starter: ["starter", "startar", "starters"],
  battery: ["battery", "batary", "batteries"],
  radiator: ["radiator", "radiators"],
  thermostat: ["thermostat", "thermostate", "thermostats"],
  fuel: ["fuel", "fule", "fuels"],
  injector: ["injector", "injectors"],
  pump: ["pump", "pumb", "pumps"],
  exhaust: ["exhaust", "exaust", "exhausts"],
  muffler: ["muffler", "mufler", "mufflers"],
  catalytic: ["catalytic", "catalyc"],
  filter: ["filter", "filer", "filters"],
  air: ["air"],
  oil: ["oil"],
  gear: ["gear", "gears"],
  axle: ["axle", "axes", "axles"],
  differential: ["differential", "diferential", "differencial"],
};

const AUTOMOTIVE_PATTERNS: Array<{
  re: RegExp;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}> = [
  {
    re: /\bbrak(?!e)\b/gi,
    message: "Possible typo in 'brake'",
    severity: "HIGH",
  },
  {
    re: /\bbrake\b|\bbrak\b/gi,
    message: "Check brake/break spelling",
    severity: "HIGH",
  },
  {
    re: /\bclutch\b|\bclucth\b/gi,
    message: "Possible typo in 'clutch'",
    severity: "HIGH",
  },
  {
    re: /\bwheel\b|\bwheal\b|\bwheeel\b/gi,
    message: "Possible typo in 'wheel'",
    severity: "HIGH",
  },
  {
    re: /\bsuspention\b|\bsupsension\b/gi,
    message: "Possible typo in 'suspension'",
    severity: "HIGH",
  },
  {
    re: /\btransmision\b|\btrasmission\b/gi,
    message: "Possible typo in 'transmission'",
    severity: "HIGH",
  },
  {
    re: /\basembly\b|\bassembaly\b/gi,
    message: "Possible typo in 'assembly'",
    severity: "MEDIUM",
  },
  {
    re: /\babsober\b/gi,
    message: "Possible typo in 'absorber'",
    severity: "HIGH",
  },
  {
    re: /\bbearing\b|\bbering\b/gi,
    message: "Possible typo in 'bearing'",
    severity: "MEDIUM",
  },
  { re: /\bgasket\b/gi, message: "Check gasket spelling", severity: "MEDIUM" },
  {
    re: /\bdifferential\b|\bdifferencial\b|\bdiferential\b/gi,
    message: "Possible typo in 'differential'",
    severity: "HIGH",
  },
  {
    re: /\bthermosta[te]\b/gi,
    message: "Check thermostat spelling",
    severity: "MEDIUM",
  },
  {
    re: /\bcatalyc\b/gi,
    message: "Possible typo in 'catalytic'",
    severity: "MEDIUM",
  },
  {
    re: /\bexaust\b/gi,
    message: "Possible typo in 'exhaust'",
    severity: "HIGH",
  },
  {
    re: /\bmufler\b/gi,
    message: "Possible typo in 'muffler'",
    severity: "MEDIUM",
  },
  {
    re: /\bfiler\b/gi,
    message: "Possible typo in 'filter'",
    severity: "MEDIUM",
  },
  {
    re: /\b(\w)\s{2,}/gi,
    message: "Multiple spaces detected",
    severity: "MEDIUM",
  },
  {
    re: /^\s+|\s+$/gi,
    message: "Leading or trailing whitespace",
    severity: "LOW",
  },
  {
    re: /([a-zA-Z])\1\1/gi,
    message: "Repeated character sequence",
    severity: "MEDIUM",
  },
  { re: /[!?.,-]{3,}/gi, message: "Repeated punctuation", severity: "LOW" },
];

function detectAutomotiveTypos(product: ProductDoc): TypoIssue[] {
  const issues: TypoIssue[] = [];
  const fields = [
    { key: "partName", value: product.partName || "" },
    { key: "partNumber", value: product.partNumber || "" },
    { key: "partCategory", value: product.partCategory || "" },
    { key: "vehicleCompany", value: product.vehicleCompany || "" },
    { key: "companyName", value: product.companyName || "" },
    { key: "additionalDetails", value: product.additionalDetails || "" },
  ];

  for (const field of fields) {
    if (!field.value.trim()) {
      if (["partName", "partNumber"].includes(field.key)) {
        issues.push({
          productId: "",
          brandId: "",
          brandName: "",
          partCategory: product.partCategory || "",
          partNumber: product.partNumber || "",
          partName: product.partName || "",
          field: field.key,
          originalValue: field.value,
          issueType: "MISSING_VALUE",
          issueDescription: `${field.key} is empty`,
          severity: field.key === "partName" ? "CRITICAL" : "HIGH",
        });
      }
      continue;
    }

    for (const pattern of AUTOMOTIVE_PATTERNS) {
      if (pattern.re.test(field.value)) {
        issues.push({
          productId: "",
          brandId: "",
          brandName: "",
          partCategory: product.partCategory || "",
          partNumber: product.partNumber || "",
          partName: product.partName || "",
          field: field.key,
          originalValue: field.value,
          issueType: "PATTERN_MATCH",
          issueDescription: pattern.message,
          severity: pattern.severity,
        });
        pattern.re.lastIndex = 0;
      }
    }

    for (const [term, variants] of Object.entries(AUTOMOTIVE_TERMS)) {
      for (const variant of variants) {
        if (field.value.toLowerCase().includes(variant)) {
          const regexMisspellings = variants.filter((v) => v !== term);
          for (const misspell of regexMisspellings) {
            if (field.value.toLowerCase().includes(misspell)) {
              issues.push({
                productId: "",
                brandId: "",
                brandName: "",
                partCategory: product.partCategory || "",
                partNumber: product.partNumber || "",
                partName: product.partName || "",
                field: field.key,
                originalValue: field.value,
                issueType: "AUTOMOTIVE_TYPO",
                issueDescription: `Possible misspelling: "${misspell}" should be "${term}"`,
                suggestedFix: field.value.replace(
                  new RegExp(misspell, "gi"),
                  term
                ),
                severity: "HIGH",
              });
              break;
            }
          }
        }
      }
    }
  }

  return issues;
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

async function createTypoAuditReport() {
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
    "typo-audit-app"
  );
  const db = app.firestore();

  console.log("Scanning Firestore products from production...");
  const snap = await db.collection("products").get();
  console.log(`Products fetched: ${snap.size}`);

  const products = snap.docs.map((doc) => {
    const data = doc.data() as ProductDoc;
    const brandId = resolveBrandId(data);
    const brandName = resolveBrandName(data, brandId);

    const product = {
      productId: doc.id,
      brandId,
      brandName,
      partCategory: (data.partCategory || "").toString(),
      partNumber: (data.partNumber || "").toString(),
      partName: (data.partName || "").toString(),
      data,
    };

    return product;
  });

  console.log("Analyzing for automotive typos...");

  const allTypoIssues: TypoIssue[] = [];
  for (const product of products) {
    const issues = detectAutomotiveTypos(product.data);
    for (const issue of issues) {
      issue.productId = product.productId;
      issue.brandId = product.brandId;
      issue.brandName = product.brandName;
      allTypoIssues.push(issue);
    }
  }

  const workbook = new ExcelJS.Workbook();
  const appBaseUrl = "https://meghasalescorporation.in";

  // Summary sheet
  console.log("Creating summary sheet...");
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 35 },
    { header: "Count", key: "count", width: 15 },
    { header: "Percentage", key: "percentage", width: 15 },
  ];

  const productsWithTypos = new Set(allTypoIssues.map((i) => i.productId)).size;
  const summaryData = [
    {
      metric: "Total Products Scanned",
      count: products.length,
      percentage: "100%",
    },
    {
      metric: "Products with Typos",
      count: productsWithTypos,
      percentage: `${((productsWithTypos / products.length) * 100).toFixed(
        1
      )}%`,
    },
    {
      metric: "Total Typo Issues Found",
      count: allTypoIssues.length,
      percentage: "100%",
    },
    {
      metric: "Critical Severity Issues",
      count: allTypoIssues.filter((i) => i.severity === "CRITICAL").length,
      percentage: `${(
        (allTypoIssues.filter((i) => i.severity === "CRITICAL").length /
          allTypoIssues.length) *
        100
      ).toFixed(1)}%`,
    },
    {
      metric: "High Severity Issues",
      count: allTypoIssues.filter((i) => i.severity === "HIGH").length,
      percentage: `${(
        (allTypoIssues.filter((i) => i.severity === "HIGH").length /
          allTypoIssues.length) *
        100
      ).toFixed(1)}%`,
    },
    {
      metric: "Medium Severity Issues",
      count: allTypoIssues.filter((i) => i.severity === "MEDIUM").length,
      percentage: `${(
        (allTypoIssues.filter((i) => i.severity === "MEDIUM").length /
          allTypoIssues.length) *
        100
      ).toFixed(1)}%`,
    },
    {
      metric: "Low Severity Issues",
      count: allTypoIssues.filter((i) => i.severity === "LOW").length,
      percentage: `${(
        (allTypoIssues.filter((i) => i.severity === "LOW").length /
          allTypoIssues.length) *
        100
      ).toFixed(1)}%`,
    },
  ];

  summarySheet.addRows(summaryData);
  summarySheet.getRow(1).font = { bold: true };

  // All Typos sheet
  console.log("Creating all typos sheet...");
  const allTyposSheet = workbook.addWorksheet("All Typos");
  allTyposSheet.columns = [
    { header: "Severity", key: "severity", width: 12 },
    { header: "Brand", key: "brandName", width: 20 },
    { header: "Product ID", key: "productId", width: 30 },
    { header: "Category", key: "partCategory", width: 18 },
    { header: "Part Name", key: "partName", width: 30 },
    { header: "Part Number", key: "partNumber", width: 18 },
    { header: "Field with Issue", key: "field", width: 16 },
    { header: "Original Value", key: "originalValue", width: 40 },
    { header: "Issue Description", key: "issueDescription", width: 40 },
    { header: "Suggested Fix", key: "suggestedFix", width: 40 },
    { header: "Edit Link", key: "editLink", width: 70 },
  ];

  const sortedTypos = allTypoIssues.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const allTyposData = sortedTypos.map((issue) => ({
    ...issue,
    editLink: `${appBaseUrl}/admin-dashboard/edit-product/${issue.brandId}/${issue.productId}`,
  }));

  allTyposSheet.addRows(allTyposData);
  allTyposSheet.getRow(1).font = { bold: true };

  // Color code severity
  for (let i = 2; i <= allTyposSheet.rowCount; i++) {
    const row = allTyposSheet.getRow(i);
    const severity = row.getCell("A").value;
    if (severity === "CRITICAL") {
      row.font = { color: { argb: "FFFF0000" } };
    } else if (severity === "HIGH") {
      row.font = { color: { argb: "FFFF9900" } };
    }
  }

  // Add hyperlinks
  for (let i = 2; i <= allTyposSheet.rowCount; i++) {
    const cell = allTyposSheet.getCell(`K${i}`);
    const value = String(cell.value || "");
    if (value.startsWith("http")) {
      cell.value = { text: "Edit Product", hyperlink: value };
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }

  // Typos by Severity sheet
  console.log("Creating severity breakdown sheet...");
  const byIssueSheet = workbook.addWorksheet("By Issue Type");
  byIssueSheet.columns = [
    { header: "Issue Description", key: "description", width: 45 },
    { header: "Frequency", key: "count", width: 12 },
    { header: "Percentage", key: "percentage", width: 12 },
  ];

  const issueTypeMap = new Map<string, number>();
  for (const issue of allTypoIssues) {
    issueTypeMap.set(
      issue.issueDescription,
      (issueTypeMap.get(issue.issueDescription) || 0) + 1
    );
  }

  const issueData = Array.from(issueTypeMap.entries())
    .map(([desc, count]) => ({
      description: desc,
      count,
      percentage: `${((count / allTypoIssues.length) * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.count - a.count);

  byIssueSheet.addRows(issueData);
  byIssueSheet.getRow(1).font = { bold: true };

  // Typos by Brand sheet
  console.log("Creating by brand sheet...");
  const byBrandSheet = workbook.addWorksheet("By Brand");
  byBrandSheet.columns = [
    { header: "Brand", key: "brandName", width: 22 },
    { header: "Total Products", key: "totalProducts", width: 15 },
    { header: "Products with Typos", key: "productsWithTypos", width: 18 },
    { header: "Total Typo Issues", key: "totalIssues", width: 16 },
    { header: "Critical", key: "critical", width: 10 },
    { header: "High", key: "high", width: 10 },
    { header: "Medium", key: "medium", width: 10 },
    { header: "Low", key: "low", width: 10 },
  ];

  const brandIds = Array.from(new Set(products.map((p) => p.brandId))).sort();
  const brandData = brandIds.map((brandId) => {
    const brandProducts = products.filter((p) => p.brandId === brandId);
    const brandTypos = allTypoIssues.filter((i) => i.brandId === brandId);
    const productsWithTypos = new Set(brandTypos.map((i) => i.productId)).size;

    return {
      brandName: brandProducts[0]?.brandName || brandId,
      totalProducts: brandProducts.length,
      productsWithTypos,
      totalIssues: brandTypos.length,
      critical: brandTypos.filter((i) => i.severity === "CRITICAL").length,
      high: brandTypos.filter((i) => i.severity === "HIGH").length,
      medium: brandTypos.filter((i) => i.severity === "MEDIUM").length,
      low: brandTypos.filter((i) => i.severity === "LOW").length,
    };
  });

  byBrandSheet.addRows(brandData.sort((a, b) => b.totalIssues - a.totalIssues));
  byBrandSheet.getRow(1).font = { bold: true };

  // Typos by Category sheet
  console.log("Creating by category sheet...");
  const byCategorySheet = workbook.addWorksheet("By Category");
  byCategorySheet.columns = [
    { header: "Category", key: "category", width: 25 },
    { header: "Total Products", key: "totalProducts", width: 15 },
    { header: "Products with Typos", key: "productsWithTypos", width: 18 },
    { header: "Total Typo Issues", key: "totalIssues", width: 16 },
    { header: "Critical", key: "critical", width: 10 },
    { header: "High", key: "high", width: 10 },
    { header: "Medium", key: "medium", width: 10 },
  ];

  const allCategories = Array.from(
    new Set(products.map((p) => p.partCategory).filter((c) => c.trim()))
  ).sort();

  const categoryData = allCategories.map((cat) => {
    const catProducts = products.filter((p) => p.partCategory === cat);
    const catTypos = allTypoIssues.filter((i) => i.partCategory === cat);
    const productsWithTypos = new Set(catTypos.map((i) => i.productId)).size;

    return {
      category: cat,
      totalProducts: catProducts.length,
      productsWithTypos,
      totalIssues: catTypos.length,
      critical: catTypos.filter((i) => i.severity === "CRITICAL").length,
      high: catTypos.filter((i) => i.severity === "HIGH").length,
      medium: catTypos.filter((i) => i.severity === "MEDIUM").length,
    };
  });

  byCategorySheet.addRows(
    categoryData
      .filter((c) => c.totalIssues > 0)
      .sort((a, b) => b.totalIssues - a.totalIssues)
  );
  byCategorySheet.getRow(1).font = { bold: true };

  // Critical Issues sheet
  console.log("Creating critical issues sheet...");
  const criticalSheet = workbook.addWorksheet("Critical Only");
  criticalSheet.columns = [
    { header: "Brand", key: "brandName", width: 20 },
    { header: "Product ID", key: "productId", width: 30 },
    { header: "Category", key: "partCategory", width: 18 },
    { header: "Part Name", key: "partName", width: 30 },
    { header: "Issue Description", key: "issueDescription", width: 45 },
    { header: "Suggested Fix", key: "suggestedFix", width: 40 },
  ];

  const criticalIssues = allTypoIssues.filter((i) => i.severity === "CRITICAL");
  criticalSheet.addRows(criticalIssues);
  criticalSheet.getRow(1).font = { bold: true };

  for (let i = 2; i <= criticalSheet.rowCount; i++) {
    criticalSheet.getRow(i).font = { color: { argb: "FFFF0000" } };
  }

  // Write file
  const outputPath = "scripts/firestore/reports/typo-audit.xlsx";
  const absoluteOutput = path.resolve(process.cwd(), outputPath);
  const outputDir = path.dirname(absoluteOutput);
  fs.mkdirSync(outputDir, { recursive: true });

  await workbook.xlsx.writeFile(absoluteOutput);

  console.log("\nTypo Audit Report Generated");
  console.log(`Output: ${absoluteOutput}`);
  console.log(`Products with Issues: ${productsWithTypos}/${products.length}`);
  console.log(`Total Issues: ${allTypoIssues.length}`);

  await app.delete();
}

createTypoAuditReport().catch((error) => {
  console.error("Audit failed:", error);
  process.exitCode = 1;
});
