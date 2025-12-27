import admin from "firebase-admin";
import { z } from "zod";
import ExcelJS from "exceljs";
import * as path from "path";

export interface ValidationResult {
  productId: string;
  docId: string;
  isValid: boolean;
  errors: string[];
  missingSchemaFields: string[];
  missingRequiredFields: string[];
  extraDbFields: string[];
  fixesApplied: string[];
  wouldFix: string[];
}

const SCHEMA_FIELDS = [
  "brandName",
  "companyName",
  "vehicleCompany",
  "vehicleNames",
  "partCategory",
  "partNumber",
  "partName",
  "price",
  "discount",
  "gst",
  "stock",
  "status",
  "additionalDetails",
  "hasSizes",
  "samePriceForAllSizes",
  "sizes",
  "image",
] as const;

const REQUIRED_FIELDS = [
  "additionalDetails",
  "brandName",
  "companyName",
  "vehicleCompany",
  "vehicleNames",
  "partCategory",
  "partNumber",
  "partName",
  "status",
] as const;

export const productDataSchema = z
  .object({
    brandName: z.string().min(1, "Select a Brand Name"),
    companyName: z.string().min(1, "Select a Company Name"),
    vehicleCompany: z.string().min(1, "Select a Vehicle Company"),
    vehicleNames: z
      .array(z.string().min(2, "Vehicle Type must be at least 2 characters"))
      .min(1, "Select at least one Vehicle Type"),
    partCategory: z.string().min(1, "Select a Part Category"),
    partNumber: z.string().min(2, "Part Number must be at least 2 characters"),
    partName: z.string().min(2, "Part Name must be at least 2 characters"),
    price: z.coerce.number().min(0, "Price must be at least zero").optional(),
    discount: z.coerce
      .number()
      .min(0, "Discount must be at least zero")
      .max(100)
      .optional(),
    gst: z.coerce
      .number()
      .min(0, "GST must be at least zero")
      .max(100)
      .optional(),
    stock: z.coerce.number().optional(),
    status: z.enum(["draft", "for-sale", "discontinued", "out-of-stock"]),
    additionalDetails: z.string(),
    hasSizes: z.boolean().default(false),
    samePriceForAllSizes: z.boolean().default(true),
    sizes: z
      .array(
        z.object({
          size: z.string().min(1, "Size is required"),
          price: z.coerce
            .number()
            .min(0, "Price must be at least zero")
            .optional(),
          discount: z.coerce
            .number()
            .min(0, "Discount must be at least zero")
            .max(100)
            .optional(),
          gst: z.coerce
            .number()
            .min(0, "GST must be at least zero")
            .max(100)
            .optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const hasSizes = data.hasSizes ?? false;
    const samePrice = data.samePriceForAllSizes ?? true;

    if (!hasSizes || (hasSizes && samePrice)) {
      // Require global pricing
      if (
        data.price === undefined ||
        data.discount === undefined ||
        data.gst === undefined
      ) {
        ctx.addIssue({
          path: ["price"],
          message: "Provide global price, discount and GST",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    if (hasSizes && !samePrice) {
      if (!data.sizes || data.sizes.length === 0) {
        ctx.addIssue({
          path: ["sizes"],
          message: "Add at least one size with pricing",
          code: z.ZodIssueCode.custom,
        });
      } else {
        data.sizes.forEach((s: any, idx: number) => {
          if (!s.size?.trim()) {
            ctx.addIssue({
              path: ["sizes", idx, "size"],
              message: "Size is required",
              code: z.ZodIssueCode.custom,
            });
          }

          if (s.price === undefined) {
            ctx.addIssue({
              path: ["sizes", idx, "price"],
              message: "Price is required",
              code: z.ZodIssueCode.custom,
            });
          }

          if (s.discount === undefined) {
            ctx.addIssue({
              path: ["sizes", idx, "discount"],
              message: "Discount is required",
              code: z.ZodIssueCode.custom,
            });
          }

          if (s.gst === undefined) {
            ctx.addIssue({
              path: ["sizes", idx, "gst"],
              message: "GST is required",
              code: z.ZodIssueCode.custom,
            });
          }
        });
      }
    }

    // If hasSizes + samePrice: only validate size.label
    if (hasSizes && samePrice) {
      data.sizes.forEach((s: any, idx: number) => {
        if (!s.size?.trim()) {
          ctx.addIssue({
            path: ["sizes", idx, "size"],
            message: "Size is required",
            code: z.ZodIssueCode.custom,
          });
        }
        // Do NOT validate price/discount/gst here
      });
    }
  });

export async function generateProductReport(): Promise<{
  filepath: string;
  summary: {
    totalProducts: number;
    validProducts: number;
    invalidProducts: number;
    invalidPercentage: string;
    productsWithMissingFields: number;
    productsWithExtraFields: number;
  };
}> {
  try {
    // Initialize Firestore (READ-ONLY)
    const sourceApp = admin.initializeApp(
      {
        credential: admin.credential.cert(
          require("./serviceAccount.prod.json"),
        ),
      },
      "prodReportApp",
    );
    const sourceDb = sourceApp.firestore();

    console.log("🔍 Generating READ-ONLY product validation report...");
    console.log("📱 Collection: 'products'");

    const productsRef = sourceDb.collection("products");
    const snapshot = await productsRef.get();

    const results: ValidationResult[] = [];
    const fieldCounts: { [key: string]: number } = {};
    const schemaFieldSet = new Set<string>(SCHEMA_FIELDS);

    console.log(`📊 Found ${snapshot.size} products`);

    for (const doc of snapshot.docs) {
      const productId = doc.id;
      const data = { ...doc.data() } as any;

      // Count all fields present in DB
      Object.keys(data).forEach((field) => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });

      try {
        const result = productDataSchema.safeParse(data);

        if (result.success) {
          results.push({
            productId,
            docId: doc.id,
            isValid: true,
            errors: [],
            missingSchemaFields: [],
            missingRequiredFields: [],
            extraDbFields: [],
            fixesApplied: [],
            wouldFix: [],
          });
        } else {
          const errorMessages = result.error.errors.map(
            (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`,
          );

          const missingSchemaFields = SCHEMA_FIELDS.filter((field) => {
            const value = data[field];
            return (
              value === undefined ||
              value === null ||
              value === "" ||
              (typeof value === "string" && value.trim() === "")
            );
          });

          const missingRequiredFields = REQUIRED_FIELDS.filter((field) => {
            const value = data[field];
            return (
              value === undefined ||
              value === null ||
              value === "" ||
              (typeof value === "string" && value.trim() === "")
            );
          });

          const extraFields = Object.keys(data).filter(
            (field) => !schemaFieldSet.has(field),
          );

          results.push({
            productId,
            docId: doc.id,
            isValid: false,
            errors: errorMessages,
            missingSchemaFields,
            missingRequiredFields,
            extraDbFields: extraFields,
            fixesApplied: [],
            wouldFix: [],
          });
        }
      } catch (parseError) {
        results.push({
          productId,
          docId: doc.id,
          isValid: false,
          errors: [`Parse error: ${(parseError as Error).message}`],
          missingSchemaFields: [],
          missingRequiredFields: [],
          extraDbFields: [],
          fixesApplied: [],
          wouldFix: [],
        });
      }
    }

    // Create comprehensive Excel report
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Executive Summary
    const summarySheet = workbook.addWorksheet("📊 Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 35 },
      { header: "Count", key: "count", width: 20 },
      { header: "Details", key: "details", width: 50 },
    ];

    const invalidCount = results.filter((r) => !r.isValid).length;
    const validCount = results.filter((r) => r.isValid).length;
    const missingFieldsCount = results.filter(
      (r) => r.missingSchemaFields.length > 0,
    ).length;
    const extraFieldsCount = results.filter(
      (r) => r.extraDbFields.length > 0,
    ).length;

    const summary = {
      totalProducts: results.length,
      validProducts: validCount,
      invalidProducts: invalidCount,
      invalidPercentage:
        ((invalidCount / results.length) * 100).toFixed(2) + "%",
      productsWithMissingFields: missingFieldsCount,
      productsWithExtraFields: extraFieldsCount,
    };

    summarySheet.addRows([
      { metric: "Total Products", count: results.length, details: "" },
      { metric: "✅ Valid Products", count: validCount, details: "" },
      { metric: "❌ Invalid Products", count: invalidCount, details: "" },
      {
        metric: "📈 Invalid %",
        count: summary.invalidPercentage,
        details: `${((invalidCount / results.length) * 100).toFixed(2)}% of total`,
      },
      {
        metric: "🔧 Missing Schema Fields",
        count: missingFieldsCount,
        details: `${Math.round((missingFieldsCount / results.length) * 100)}% affected`,
      },
      {
        metric: "⚠️ Extra DB Fields",
        count: extraFieldsCount,
        details: `${Math.round((extraFieldsCount / results.length) * 100)}% affected`,
      },
    ]);

    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF366092" },
    };
    summarySheet.columns.forEach((col) => (col.alignment = { wrapText: true }));

    // Sheet 2: Invalid Products (detailed issues)
    const invalidSheet = workbook.addWorksheet("❌ Invalid Products");
    invalidSheet.columns = [
      { header: "Product ID", key: "productId", width: 20 },
      { header: "Doc ID", key: "docId", width: 25 },
      { header: "Missing Schema Fields", key: "missingSchema", width: 30 },
      { header: "Missing Required Fields", key: "missingRequired", width: 25 },
      { header: "Extra DB Fields", key: "extraFields", width: 25 },
      { header: "Validation Errors", key: "errors", width: 50 },
    ];

    const invalidProducts = results.filter((r) => !r.isValid);
    invalidSheet.addRows(
      invalidProducts.map((product) => ({
        productId: product.productId,
        docId: product.docId,
        missingSchema: product.missingSchemaFields.join(", ") || "None",
        missingRequired: product.missingRequiredFields.join(", ") || "None",
        extraFields: product.extraDbFields.join(", ") || "None",
        errors: product.errors.join(" | ") || "Parse error",
      })),
    );

    invalidSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    invalidSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC00000" },
    };
    invalidSheet.columns.forEach(
      (col) => (col.alignment = { wrapText: true, vertical: "top" }),
    );

    // Sheet 3: Field Coverage Analysis
    const fieldSheet = workbook.addWorksheet("📈 Field Coverage");
    fieldSheet.columns = [
      { header: "Field Name", key: "fieldName", width: 30 },
      { header: "Usage Count", key: "count", width: 15 },
      { header: "Coverage %", key: "coverage", width: 15 },
      { header: "Schema Expected", key: "inSchema", width: 15 },
    ];

    const fieldRows = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([field, count]) => {
        const coverage = ((count / results.length) * 100).toFixed(2) + "%";
        const inSchema = schemaFieldSet.has(field) ? "✅ YES" : "❌ NO";
        return {
          fieldName: field,
          count,
          coverage,
          inSchema,
        };
      });

    fieldSheet.addRows(fieldRows);
    fieldSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    fieldSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF366092" },
    };

    // Sheet 4: All Products Status (compact view)
    const allProductsSheet = workbook.addWorksheet("📋 All Products");
    allProductsSheet.columns = [
      { header: "Product ID", key: "productId", width: 20 },
      { header: "Doc ID", key: "docId", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Missing Fields", key: "missingCount", width: 15 },
      { header: "Extra Fields", key: "extraCount", width: 15 },
    ];

    allProductsSheet.addRows(
      results.map((product) => ({
        productId: product.productId,
        docId: product.docId,
        status: product.isValid ? "✅ VALID" : "❌ INVALID",
        missingCount: product.missingSchemaFields.length,
        extraCount: product.extraDbFields.length,
      })),
    );

    allProductsSheet.getRow(1).font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    allProductsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };

    // Save report
    const filename = `product-validation-report-${new Date().toISOString().split("T")[0]}.xlsx`;
    const filepath = path.join(process.cwd(), filename);
    await workbook.xlsx.writeFile(filepath);

    console.log(`✅ Report generated: ${filepath}`);
    console.log(
      `📊 Summary: ${validCount} valid, ${invalidCount} invalid (${summary.invalidPercentage})`,
    );
    console.table(summary);

    return { filepath, summary };
  } catch (error) {
    console.error("❌ Report generation failed:", error);
    throw error;
  }
}

// 🚀 RUN THE REPORT (100% READ-ONLY - NO DB CHANGES)
console.log("\n=== READ-ONLY PRODUCT VALIDATION REPORT ===");
generateProductReport()
  .then(({ filepath, summary }) => {
    console.log(`✅ Report saved: ${filepath}`);
    console.log("📁 Check Excel file for detailed analysis!");
  })
  .catch(console.error);
