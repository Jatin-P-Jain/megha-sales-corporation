import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

type ProductDoc = {
  brandId?: string;
  brandName?: string;
  partNumber?: string;
  partName?: string;
};

type MismatchRow = {
  productId: string;
  brandId: string;
  brandName: string;
  canonicalBrandName: string;
  partNumber: string;
  partName: string;
};

type MissingBrandRow = {
  productId: string;
  brandId: string;
  brandName: string;
  partNumber: string;
  partName: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (const arg of args) {
    const [key, ...rest] = arg.split("=");
    if (!key.startsWith("--")) continue;
    map.set(key.slice(2), rest.join("=") || "true");
  }

  return {
    output:
      map.get("output") ||
      "scripts/firestore/reports/product-brand-integrity-report.json",
  };
}

async function main() {
  const { output } = parseArgs();

  const serviceAccountPath = path.join(
    process.cwd(),
    "serviceAccount.prod.json"
  );
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  ) as admin.ServiceAccount;

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = app.firestore();

  const [brandsSnap, productsSnap] = await Promise.all([
    db.collection("brands").get(),
    db.collection("products").get(),
  ]);

  const brandById = new Map<string, { brandName?: string }>();
  for (const doc of brandsSnap.docs) {
    brandById.set(doc.id, doc.data() as { brandName?: string });
  }

  const missingBrandIds: MissingBrandRow[] = [];
  const brandNameMismatches: MismatchRow[] = [];

  for (const doc of productsSnap.docs) {
    const p = (doc.data() || {}) as ProductDoc;
    const brandId = (p.brandId || "").trim();
    const brandName = (p.brandName || "").trim();

    if (!brandId || !brandById.has(brandId)) {
      missingBrandIds.push({
        productId: doc.id,
        brandId,
        brandName,
        partNumber: (p.partNumber || "").trim(),
        partName: (p.partName || "").trim(),
      });
      continue;
    }

    const canonicalBrandName = String(
      brandById.get(brandId)?.brandName || ""
    ).trim();
    if (canonicalBrandName && brandName && canonicalBrandName !== brandName) {
      brandNameMismatches.push({
        productId: doc.id,
        brandId,
        brandName,
        canonicalBrandName,
        partNumber: (p.partNumber || "").trim(),
        partName: (p.partName || "").trim(),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalBrands: brandsSnap.size,
    totalProducts: productsSnap.size,
    missingBrandIdCount: missingBrandIds.length,
    brandNameMismatchCount: brandNameMismatches.length,
    missingBrandIds,
    brandNameMismatches,
  };

  const outputPath = path.resolve(process.cwd(), output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        totalBrands: report.totalBrands,
        totalProducts: report.totalProducts,
        missingBrandIdCount: report.missingBrandIdCount,
        brandNameMismatchCount: report.brandNameMismatchCount,
        outputPath,
      },
      null,
      2
    )
  );

  await app.delete();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
