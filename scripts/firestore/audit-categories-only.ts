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

type CategoryIssue = {
  category: string;
  productCount: number;
  potentialMatches: string[];
  similarity: number;
  matchType: "CASE_VARIATION" | "TYPO" | "SPACING" | "PUNCTUATION";
};

function levenshteinDistance(a: string, b: string): number {
  const len1 = a.length;
  const len2 = b.length;
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLen;
}

function findCategorySimilarities(categories: Set<string>): CategoryIssue[] {
  const issues: CategoryIssue[] = [];
  const catArray = Array.from(categories);

  for (let i = 0; i < catArray.length; i++) {
    for (let j = i + 1; j < catArray.length; j++) {
      const cat1 = catArray[i];
      const cat2 = catArray[j];
      const similarity = calculateSimilarity(cat1, cat2);

      if (similarity > 0.75 && similarity < 1.0) {
        let matchType: "CASE_VARIATION" | "TYPO" | "SPACING" | "PUNCTUATION" =
          "TYPO";

        if (cat1.toLowerCase() === cat2.toLowerCase()) {
          matchType = "CASE_VARIATION";
        } else if (cat1.replace(/\s/g, "") === cat2.replace(/\s/g, "")) {
          matchType = "SPACING";
        } else if (
          cat1.replace(/[^\w\s]/g, "") === cat2.replace(/[^\w\s]/g, "")
        ) {
          matchType = "PUNCTUATION";
        }

        const exists = issues.some(
          (issue) =>
            (issue.category === cat1 &&
              issue.potentialMatches.includes(cat2)) ||
            (issue.category === cat2 && issue.potentialMatches.includes(cat1))
        );

        if (!exists) {
          issues.push({
            category: cat1,
            productCount: 0,
            potentialMatches: [cat2],
            similarity,
            matchType,
          });
        }
      }
    }
  }

  return issues;
}

function resolveBrandName(brandName: string, brandId: string): string {
  if (brandName && brandName.trim()) return brandName.trim();
  return brandId
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

async function createCategoryAuditReport() {
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
    "category-audit-app"
  );
  const db = app.firestore();

  console.log("Scanning Firestore products from production...");
  const snap = await db.collection("products").get();
  console.log(`Products fetched: ${snap.size}`);

  const products = snap.docs.map((doc) => {
    const data = doc.data() as ProductDoc;
    return {
      productId: doc.id,
      brandId: (data.brandId || "").trim() || "unknown",
      brandName: resolveBrandName(
        data.brandName || "",
        (data.brandId || "").trim() || "unknown"
      ),
      partCategory: (data.partCategory || "").toString(),
    };
  });

  console.log("Analyzing categories for inconsistencies...");

  const allCategories = new Set(
    products.map((p) => p.partCategory).filter((c) => c.trim())
  );

  const categoryIssues = findCategorySimilarities(allCategories);

  const categoryProductCounts = new Map<string, number>();
  for (const product of products) {
    const cat = product.partCategory;
    if (cat) {
      categoryProductCounts.set(cat, (categoryProductCounts.get(cat) || 0) + 1);
    }
  }

  for (const issue of categoryIssues) {
    issue.productCount = categoryProductCounts.get(issue.category) || 0;
  }

  const workbook = new ExcelJS.Workbook();
  const appBaseUrl = "https://meghasalescorporation.in";

  // Summary sheet
  console.log("Creating summary sheet...");
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 35 },
    { header: "Value", key: "value", width: 20 },
  ];

  const summaryData = [
    { metric: "Total Products Scanned", value: products.length },
    { metric: "Total Unique Categories", value: allCategories.size },
    { metric: "Category Inconsistencies Found", value: categoryIssues.length },
    {
      metric: "Products Affected by Issues",
      value: categoryIssues.reduce((sum, issue) => sum + issue.productCount, 0),
    },
  ];

  summarySheet.addRows(summaryData);
  summarySheet.getRow(1).font = { bold: true };

  // All Issues sheet
  console.log("Creating category issues sheet...");
  const issuesSheet = workbook.addWorksheet("Category Issues");
  issuesSheet.columns = [
    { header: "Category", key: "category", width: 25 },
    { header: "Product Count", key: "productCount", width: 15 },
    { header: "Issue Type", key: "matchType", width: 18 },
    { header: "Potential Duplicate(s)", key: "potentialMatches", width: 35 },
    { header: "Similarity %", key: "similarity", width: 15 },
    { header: "Recommendation", key: "recommendation", width: 40 },
  ];

  const issueRows = categoryIssues.map((issue) => {
    const matches = issue.potentialMatches.join(", ");
    const recommendation =
      issue.matchType === "CASE_VARIATION"
        ? `Merge to one case variant`
        : issue.matchType === "SPACING"
        ? `Remove extra spaces`
        : issue.matchType === "PUNCTUATION"
        ? `Standardize punctuation`
        : `Review and merge if same product type`;

    return {
      category: issue.category,
      productCount: issue.productCount,
      matchType: issue.matchType,
      potentialMatches: matches,
      similarity: `${(issue.similarity * 100).toFixed(1)}%`,
      recommendation,
    };
  });

  issuesSheet.addRows(
    issueRows.sort((a, b) => parseInt(b.similarity) - parseInt(a.similarity))
  );
  issuesSheet.getRow(1).font = { bold: true };

  // Category Details sheet
  console.log("Creating category details sheet...");
  const detailsSheet = workbook.addWorksheet("Category Details");
  detailsSheet.columns = [
    { header: "Category Name", key: "category", width: 30 },
    { header: "Product Count", key: "count", width: 15 },
    { header: "Brands in Category", key: "brands", width: 35 },
  ];

  const categoryDetails = Array.from(allCategories).map((cat) => {
    const productsInCat = products.filter((p) => p.partCategory === cat);
    const brandsInCat = new Set(productsInCat.map((p) => p.brandName));

    return {
      category: cat,
      count: productsInCat.length,
      brands:
        Array.from(brandsInCat).slice(0, 5).join(", ") +
        (brandsInCat.size > 5 ? "..." : ""),
    };
  });

  detailsSheet.addRows(categoryDetails.sort((a, b) => b.count - a.count));
  detailsSheet.getRow(1).font = { bold: true };

  // Product List for Affected Categories sheet
  console.log("Creating product list for affected categories...");
  const productListSheet = workbook.addWorksheet("Products in Issues");
  productListSheet.columns = [
    { header: "Category (Original)", key: "category", width: 25 },
    { header: "Product ID", key: "productId", width: 30 },
    { header: "Brand", key: "brandName", width: 20 },
    { header: "Part Name", key: "partName", width: 30 },
    { header: "Potential Merge Category", key: "suggestion", width: 25 },
    { header: "Edit Link", key: "editLink", width: 70 },
  ];

  const affectedProducts = [];
  for (const issue of categoryIssues) {
    const productsInCat = products.filter(
      (p) => p.partCategory === issue.category
    );
    for (const product of productsInCat) {
      const editLink = `${appBaseUrl}/admin-dashboard/edit-product/${product.brandId}/${product.productId}`;
      affectedProducts.push({
        category: issue.category,
        productId: product.productId,
        brandName: product.brandName,
        partName: product.partCategory,
        suggestion: issue.potentialMatches.join(", "),
        editLink,
      });
    }
  }

  productListSheet.addRows(affectedProducts);
  productListSheet.getRow(1).font = { bold: true };

  // Add hyperlinks
  for (let i = 2; i <= productListSheet.rowCount; i++) {
    const cell = productListSheet.getCell(`F${i}`);
    const value = String(cell.value || "");
    if (value.startsWith("http")) {
      cell.value = { text: "Edit Product", hyperlink: value };
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }

  // Category Growth sheet (how many products per category)
  console.log("Creating category distribution sheet...");
  const distributionSheet = workbook.addWorksheet("Distribution");
  distributionSheet.columns = [
    { header: "Category", key: "category", width: 30 },
    { header: "Product Count", key: "count", width: 15 },
    { header: "Percentage", key: "percentage", width: 15 },
    { header: "Has Issue", key: "hasIssue", width: 15 },
  ];

  const distributionData = Array.from(allCategories)
    .map((cat) => {
      const count = categoryProductCounts.get(cat) || 0;
      const hasIssue = categoryIssues.some((issue) => issue.category === cat)
        ? "YES"
        : "NO";
      return {
        category: cat,
        count,
        percentage: `${((count / products.length) * 100).toFixed(2)}%`,
        hasIssue,
      };
    })
    .sort((a, b) => b.count - a.count);

  distributionSheet.addRows(distributionData);
  distributionSheet.getRow(1).font = { bold: true };

  // Write file
  const outputPath = "scripts/firestore/reports/category-audit.xlsx";
  const absoluteOutput = path.resolve(process.cwd(), outputPath);
  const outputDir = path.dirname(absoluteOutput);
  fs.mkdirSync(outputDir, { recursive: true });

  await workbook.xlsx.writeFile(absoluteOutput);

  console.log("\nCategory Audit Report Generated");
  console.log(`Output: ${absoluteOutput}`);
  console.log(`Total Categories: ${allCategories.size}`);
  console.log(`Issues Found: ${categoryIssues.length}`);
  console.log(`Products Affected: ${affectedProducts.length}`);

  await app.delete();
}

createCategoryAuditReport().catch((error) => {
  console.error("Audit failed:", error);
  process.exitCode = 1;
});
