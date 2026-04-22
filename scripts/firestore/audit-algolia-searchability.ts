import fs from "node:fs";
import path from "node:path";

import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import admin from "firebase-admin";

type ProductDoc = {
  id: string;
  partNumber?: string;
  partName?: string;
  brandId?: string;
};

type CheckName =
  | "partNumberNoSpace"
  | "partNumberWithSpace"
  | "partNumberPartialPrefix"
  | "partNumberPartialSuffix"
  | "partNumberMiddleSubset"
  | "partNumberAlphaNumSpaced"
  | "partNamePartial"
  | "partNamePrefix";

type CheckStatus = "pass" | "fail" | "skipped";

type CheckCounter = {
  pass: number;
  fail: number;
  skipped: number;
};

type FailureRow = {
  id: string;
  brandId: string;
  partNumber: string;
  partName: string;
  checkName: CheckName;
  query: string;
  reasonCode: string;
  reasonDetail: string;
  mitigation: string;
};

type SearchabilityReport = {
  generatedAt: string;
  totals: {
    firestoreProducts: number;
    totalChecksEvaluated: number;
    totalRunnableChecks: number;
  };
  checks: Record<CheckName, CheckCounter>;
  failures: Record<CheckName, FailureRow[]>;
};

type PlannedCheck = {
  name: CheckName;
  label: string;
  priority: number;
  query: string;
  product: ProductDoc;
  partNumber: string;
  partName: string;
  partNumberCompact: string;
  partNumberAlnumOnly: string;
  checkType: "partNumber" | "partName";
};

type QueryExecution = {
  ids: Set<string>;
  orderedIds: string[];
  returnedHits: number;
  matchedCount: number;
  truncatedAtLimit: boolean;
};

type FailureDiagnostics = {
  reasonCode: string;
  reasonDetail: string;
  mitigation: string;
};

type QueryResultRow = {
  id: string;
  brandId: string;
  partNumber: string;
  partName: string;
  partNumberCompact: string;
  partNumberAlnumOnly: string;
  checkName: CheckName;
  checkLabel: string;
  checkType: "partNumber" | "partName";
  priority: number;
  query: string;
  queryLength: number;
  status: CheckStatus;
  matchedCount: number;
  returnedHits: number;
  rankInReturnedHits: number | "";
  topReturnedObjectIds: string;
  reasonCode: string;
  reasonDetail: string;
  mitigation: string;
  hasDot: "Y" | "N";
  hasSlash: "Y" | "N";
  hasHyphen: "Y" | "N";
  hasParens: "Y" | "N";
};

type ProductSummaryRow = {
  id: string;
  brandId: string;
  partNumber: string;
  partName: string;
  partNumberCompact: string;
  partNumberAlnumOnly: string;
  totalChecks: number;
  runnableChecks: number;
  passed: number;
  failed: number;
  skipped: number;
  partNumberPassed: number;
  partNumberFailed: number;
  partNamePassed: number;
  partNameFailed: number;
  readinessScore: number;
  readyForPartNumber: "Y" | "N";
  readyForPartName: "Y" | "N";
  nextAction: string;
};

function loadEnvFromLocalFiles(): void {
  for (const file of [".env.production.local", ".env.development.local"]) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: false, quiet: true });
    }
  }
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function removeSpaces(value: string): string {
  return normalizeSpaces(value).replace(/\s+/g, "");
}

function addAlphaNumSpaces(value: string): string {
  return normalizeSpaces(
    value
      .replace(/([A-Za-z])(\d)/g, "$1 $2")
      .replace(/(\d)([A-Za-z])/g, "$1 $2")
  );
}

function partialPrefix(value: string, min = 3, max = 5): string {
  const clean = value.trim();
  if (!clean) {
    return "";
  }

  const ideal = Math.floor(clean.length * 0.5);
  const length = Math.min(max, Math.max(min, ideal));
  return clean.slice(0, Math.min(clean.length, length));
}

function partialSuffix(value: string, min = 3, max = 5): string {
  const clean = value.trim();
  if (!clean) {
    return "";
  }

  const ideal = Math.floor(clean.length * 0.5);
  const length = Math.min(max, Math.max(min, ideal));
  return clean.slice(
    Math.max(0, clean.length - Math.min(clean.length, length))
  );
}

function middleSubset(value: string, min = 3, max = 5): string {
  const clean = value.trim();
  if (!clean) {
    return "";
  }

  const length = Math.min(max, Math.max(min, Math.floor(clean.length * 0.4)));
  if (clean.length <= length) {
    return clean;
  }

  const start = Math.floor((clean.length - length) / 2);
  return clean.slice(start, start + length);
}

function removeNonAlphaNumeric(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "");
}

function reasonForSkipped(query: string): FailureDiagnostics {
  if (!query.trim()) {
    return {
      reasonCode: "SKIPPED_EMPTY_QUERY",
      reasonDetail: "Query was empty after normalization.",
      mitigation:
        "Ensure part number or part name fields are populated and normalized during indexing.",
    };
  }

  return {
    reasonCode: "SKIPPED_QUERY_TOO_SHORT",
    reasonDetail: "Query length was below minimum threshold (3 chars).",
    mitigation:
      "Use shorter-prefix tolerant strategy only with guarded ranking or n-gram fields.",
  };
}

function classifyFailure(
  check: PlannedCheck,
  execution: QueryExecution
): FailureDiagnostics {
  if (execution.matchedCount === 0) {
    return {
      reasonCode: "NO_HITS_RETURNED",
      reasonDetail: "Algolia returned zero matching hits for this query.",
      mitigation:
        "Add normalized searchable fields and ensure all variants are indexed.",
    };
  }

  if (execution.truncatedAtLimit) {
    return {
      reasonCode: "NOT_IN_TOP_HITS_TRUNCATED",
      reasonDetail:
        "Query returned many hits and this product was not present in returned window (possible ranking cutoff).",
      mitigation:
        "Tune ranking and searchable attributes so exact part-number variants rank above broad matches.",
    };
  }

  const hasDot = /\./.test(check.query) || /\./.test(check.partNumber);
  const hasSpecial =
    /[-/()]/.test(check.query) || /[-/()]/.test(check.partNumber);

  if (hasDot && check.checkType === "partNumber") {
    return {
      reasonCode: "DOT_TOKENIZATION_GAP",
      reasonDetail:
        "Dotted part-number format likely tokenized differently than query variant.",
      mitigation:
        "Index partNumberCompact and partNumberAlnumOnly fields and include them in searchable attributes.",
    };
  }

  if (hasSpecial && check.checkType === "partNumber") {
    return {
      reasonCode: "SPECIAL_CHAR_NORMALIZATION_GAP",
      reasonDetail:
        "Special characters (slash, hyphen, parentheses) likely caused token mismatch.",
      mitigation:
        "Normalize special characters both at indexing and query time; include punctuation-stripped variants.",
    };
  }

  if (
    check.name === "partNumberPartialPrefix" ||
    check.name === "partNumberPartialSuffix" ||
    check.name === "partNumberMiddleSubset"
  ) {
    return {
      reasonCode: "PARTIAL_SUBSET_TOO_WEAK",
      reasonDetail:
        "Subset/partial query appears too broad or not aligned with indexed token boundaries.",
      mitigation:
        "Add additional partial-friendly fields (prefix tokens, edge n-grams) for part numbers.",
    };
  }

  return {
    reasonCode: "PRODUCT_NOT_FOUND_IN_HITS",
    reasonDetail:
      "Hits were returned but this specific product was not among them.",
    mitigation:
      "Improve query expansion and ranking rules for part-number exactness before generic text relevance.",
  };
}

function suggestProductAction(row: ProductSummaryRow): string {
  if (row.failed === 0) {
    return "No action needed; all tested variants passed.";
  }

  if (row.partNumberFailed > 0 && row.partNameFailed === 0) {
    return "Prioritize part-number normalization and ranking updates.";
  }

  if (row.partNameFailed > 0 && row.partNumberFailed === 0) {
    return "Tune part-name token handling and partial matching strategy.";
  }

  return "Tune both part-number normalization and part-name matching behavior.";
}

function passRate(pass: number, fail: number): string {
  const total = pass + fail;
  if (total === 0) {
    return "n/a";
  }
  return `${((pass * 100) / total).toFixed(2)}%`;
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
  if (!appId || !searchKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_ALGOLIA_APP_ID or NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY."
    );
  }

  const serviceAccountPath = path.resolve(
    process.cwd(),
    "serviceAccount.prod.json"
  );
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Missing service account file: ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const algolia = algoliasearch(appId, searchKey);
  const indexName = "products";

  const fetchQueryIds = async (query: string): Promise<QueryExecution> => {
    const result = (await algolia.searchSingleIndex({
      indexName,
      searchParams: {
        query,
        // Use a larger page to reduce false negatives caused by strict ranking.
        hitsPerPage: 1000,
      },
    })) as {
      hits?: Array<{ objectID?: string; id?: string }>;
      nbHits?: number;
    };

    const ids = new Set<string>();
    const orderedIds: string[] = [];
    for (const hit of result.hits ?? []) {
      let id = "";
      if (hit?.objectID) {
        id = hit.objectID;
      } else if (hit?.id) {
        id = hit.id;
      }

      if (id) {
        ids.add(id);
        orderedIds.push(id);
      }
    }

    return {
      ids,
      orderedIds,
      returnedHits: orderedIds.length,
      matchedCount: Number.isFinite(result.nbHits)
        ? Number(result.nbHits)
        : orderedIds.length,
      truncatedAtLimit: orderedIds.length >= 1000,
    };
  };

  const runWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    handler: (item: T) => Promise<R>
  ): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let index = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const current = index;
        index += 1;
        if (current >= items.length) {
          return;
        }
        results[current] = await handler(items[current]);
      }
    };

    const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
      worker()
    );
    await Promise.all(workers);
    return results;
  };

  const snap = await db.collection("products").get();
  const products: ProductDoc[] = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProductDoc, "id">),
  }));

  const report: SearchabilityReport = {
    generatedAt: new Date().toISOString(),
    totals: {
      firestoreProducts: products.length,
      totalChecksEvaluated: 0,
      totalRunnableChecks: 0,
    },
    checks: {
      partNumberNoSpace: { pass: 0, fail: 0, skipped: 0 },
      partNumberWithSpace: { pass: 0, fail: 0, skipped: 0 },
      partNumberPartialPrefix: { pass: 0, fail: 0, skipped: 0 },
      partNumberPartialSuffix: { pass: 0, fail: 0, skipped: 0 },
      partNumberMiddleSubset: { pass: 0, fail: 0, skipped: 0 },
      partNumberAlphaNumSpaced: { pass: 0, fail: 0, skipped: 0 },
      partNamePartial: { pass: 0, fail: 0, skipped: 0 },
      partNamePrefix: { pass: 0, fail: 0, skipped: 0 },
    },
    failures: {
      partNumberNoSpace: [],
      partNumberWithSpace: [],
      partNumberPartialPrefix: [],
      partNumberPartialSuffix: [],
      partNumberMiddleSubset: [],
      partNumberAlphaNumSpaced: [],
      partNamePartial: [],
      partNamePrefix: [],
    },
  };

  const plannedChecks: PlannedCheck[] = [];

  let planned = 0;

  for (const product of products) {
    planned += 1;
    if (planned % 400 === 0 || planned === products.length) {
      console.log(`Prepared ${planned}/${products.length}`);
    }

    const partNumber = normalizeSpaces(product.partNumber ?? "");
    const partNumberNoSpace = removeSpaces(partNumber);
    const partNumberWithSpace = addAlphaNumSpaces(partNumber);
    const partNumberPartialPrefix = partialPrefix(partNumberNoSpace, 3, 5);
    const partNumberPartialSuffix = partialSuffix(partNumberNoSpace, 3, 5);
    const partNumberMiddle = middleSubset(partNumberNoSpace, 3, 5);
    const partNumberAlnumOnly = removeNonAlphaNumeric(partNumberNoSpace);
    const partNumberAlphaNumSpaced = addAlphaNumSpaces(partNumberAlnumOnly);

    const partName = normalizeSpaces(product.partName ?? "");
    const firstPartNameToken = partName.split(" ").find(Boolean) ?? "";
    const partNamePartial = partialPrefix(firstPartNameToken || partName, 3, 5);
    const partNamePrefix = partialPrefix(partName, 4, 8);

    const checks: Array<{
      name: CheckName;
      label: string;
      priority: number;
      query: string;
      checkType: "partNumber" | "partName";
    }> = [
      {
        name: "partNumberNoSpace",
        label: "Part Number (No Space)",
        priority: 1,
        query: partNumberNoSpace,
        checkType: "partNumber",
      },
      {
        name: "partNumberWithSpace",
        label: "Part Number (With Space)",
        priority: 1,
        query: partNumberWithSpace,
        checkType: "partNumber",
      },
      {
        name: "partNumberPartialPrefix",
        label: "Part Number Prefix Subset",
        priority: 2,
        query: partNumberPartialPrefix,
        checkType: "partNumber",
      },
      {
        name: "partNumberPartialSuffix",
        label: "Part Number Suffix Subset",
        priority: 2,
        query: partNumberPartialSuffix,
        checkType: "partNumber",
      },
      {
        name: "partNumberMiddleSubset",
        label: "Part Number Middle Subset",
        priority: 3,
        query: partNumberMiddle,
        checkType: "partNumber",
      },
      {
        name: "partNumberAlphaNumSpaced",
        label: "Part Number AlphaNum Spaced",
        priority: 2,
        query: partNumberAlphaNumSpaced,
        checkType: "partNumber",
      },
      {
        name: "partNamePartial",
        label: "Part Name Partial",
        priority: 4,
        query: partNamePartial,
        checkType: "partName",
      },
      {
        name: "partNamePrefix",
        label: "Part Name Prefix",
        priority: 4,
        query: partNamePrefix,
        checkType: "partName",
      },
    ];

    for (const check of checks) {
      plannedChecks.push({
        name: check.name,
        label: check.label,
        priority: check.priority,
        query: check.query,
        product,
        partNumber,
        partName,
        partNumberCompact: partNumberNoSpace,
        partNumberAlnumOnly,
        checkType: check.checkType,
      });
    }
  }

  const runnableChecks = plannedChecks.filter(
    (check) => Boolean(check.query.trim()) && check.query.trim().length >= 3
  );

  report.totals.totalChecksEvaluated = plannedChecks.length;
  report.totals.totalRunnableChecks = runnableChecks.length;

  const uniqueQueries = Array.from(
    new Set(runnableChecks.map((check) => check.query))
  );
  console.log(`Unique queries to execute: ${uniqueQueries.length}`);

  const queryExecutionMap = new Map<string, QueryExecution>();
  let doneQueries = 0;
  await runWithConcurrency(uniqueQueries, 20, async (query) => {
    const execution = await fetchQueryIds(query);
    queryExecutionMap.set(query, execution);
    doneQueries += 1;
    if (doneQueries % 250 === 0 || doneQueries === uniqueQueries.length) {
      console.log(`Queried ${doneQueries}/${uniqueQueries.length}`);
    }
    return null;
  });

  const queryRows: QueryResultRow[] = [];

  for (const check of plannedChecks) {
    const query = check.query.trim();
    const shortOrEmpty = !query || query.length < 3;

    if (shortOrEmpty) {
      report.checks[check.name].skipped += 1;
      const skippedReason = reasonForSkipped(query);

      queryRows.push({
        id: check.product.id,
        brandId: check.product.brandId ?? "",
        partNumber: check.partNumber,
        partName: check.partName,
        partNumberCompact: check.partNumberCompact,
        partNumberAlnumOnly: check.partNumberAlnumOnly,
        checkName: check.name,
        checkLabel: check.label,
        checkType: check.checkType,
        priority: check.priority,
        query,
        queryLength: query.length,
        status: "skipped",
        matchedCount: 0,
        returnedHits: 0,
        rankInReturnedHits: "",
        topReturnedObjectIds: "",
        reasonCode: skippedReason.reasonCode,
        reasonDetail: skippedReason.reasonDetail,
        mitigation: skippedReason.mitigation,
        hasDot: /\./.test(query) ? "Y" : "N",
        hasSlash: /\//.test(query) ? "Y" : "N",
        hasHyphen: /-/.test(query) ? "Y" : "N",
        hasParens: /[()]/.test(query) ? "Y" : "N",
      });
      continue;
    }

    const execution = queryExecutionMap.get(query) ?? {
      ids: new Set<string>(),
      orderedIds: [],
      returnedHits: 0,
      matchedCount: 0,
      truncatedAtLimit: false,
    };

    const ok = execution.ids.has(check.product.id);
    const rank = execution.orderedIds.indexOf(check.product.id);

    if (ok) {
      report.checks[check.name].pass += 1;

      queryRows.push({
        id: check.product.id,
        brandId: check.product.brandId ?? "",
        partNumber: check.partNumber,
        partName: check.partName,
        partNumberCompact: check.partNumberCompact,
        partNumberAlnumOnly: check.partNumberAlnumOnly,
        checkName: check.name,
        checkLabel: check.label,
        checkType: check.checkType,
        priority: check.priority,
        query,
        queryLength: query.length,
        status: "pass",
        matchedCount: execution.matchedCount,
        returnedHits: execution.returnedHits,
        rankInReturnedHits: rank >= 0 ? rank + 1 : "",
        topReturnedObjectIds: execution.orderedIds.slice(0, 5).join(", "),
        reasonCode: "",
        reasonDetail: "",
        mitigation: "",
        hasDot: /\./.test(query) ? "Y" : "N",
        hasSlash: /\//.test(query) ? "Y" : "N",
        hasHyphen: /-/.test(query) ? "Y" : "N",
        hasParens: /[()]/.test(query) ? "Y" : "N",
      });
      continue;
    }

    const diagnostics = classifyFailure(check, execution);
    report.checks[check.name].fail += 1;
    report.failures[check.name].push({
      id: check.product.id,
      brandId: check.product.brandId ?? "",
      partNumber: check.partNumber,
      partName: check.partName,
      checkName: check.name,
      query,
      reasonCode: diagnostics.reasonCode,
      reasonDetail: diagnostics.reasonDetail,
      mitigation: diagnostics.mitigation,
    });

    queryRows.push({
      id: check.product.id,
      brandId: check.product.brandId ?? "",
      partNumber: check.partNumber,
      partName: check.partName,
      partNumberCompact: check.partNumberCompact,
      partNumberAlnumOnly: check.partNumberAlnumOnly,
      checkName: check.name,
      checkLabel: check.label,
      checkType: check.checkType,
      priority: check.priority,
      query,
      queryLength: query.length,
      status: "fail",
      matchedCount: execution.matchedCount,
      returnedHits: execution.returnedHits,
      rankInReturnedHits: rank >= 0 ? rank + 1 : "",
      topReturnedObjectIds: execution.orderedIds.slice(0, 5).join(", "),
      reasonCode: diagnostics.reasonCode,
      reasonDetail: diagnostics.reasonDetail,
      mitigation: diagnostics.mitigation,
      hasDot: /\./.test(query) ? "Y" : "N",
      hasSlash: /\//.test(query) ? "Y" : "N",
      hasHyphen: /-/.test(query) ? "Y" : "N",
      hasParens: /[()]/.test(query) ? "Y" : "N",
    });
  }

  const productSummaryMap = new Map<string, ProductSummaryRow>();

  for (const row of queryRows) {
    let current = productSummaryMap.get(row.id);
    if (!current) {
      current = {
        id: row.id,
        brandId: row.brandId,
        partNumber: row.partNumber,
        partName: row.partName,
        partNumberCompact: row.partNumberCompact,
        partNumberAlnumOnly: row.partNumberAlnumOnly,
        totalChecks: 0,
        runnableChecks: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        partNumberPassed: 0,
        partNumberFailed: 0,
        partNamePassed: 0,
        partNameFailed: 0,
        readinessScore: 0,
        readyForPartNumber: "N",
        readyForPartName: "N",
        nextAction: "",
      };
      productSummaryMap.set(row.id, current);
    }

    current.totalChecks += 1;
    if (row.status !== "skipped") {
      current.runnableChecks += 1;
    }

    if (row.status === "pass") {
      current.passed += 1;
      if (row.checkType === "partNumber") {
        current.partNumberPassed += 1;
      } else {
        current.partNamePassed += 1;
      }
    }

    if (row.status === "fail") {
      current.failed += 1;
      if (row.checkType === "partNumber") {
        current.partNumberFailed += 1;
      } else {
        current.partNameFailed += 1;
      }
    }

    if (row.status === "skipped") {
      current.skipped += 1;
    }
  }

  const productSummaryRows = Array.from(productSummaryMap.values()).map(
    (row) => {
      row.readinessScore = row.runnableChecks
        ? Number(((row.passed * 100) / row.runnableChecks).toFixed(2))
        : 0;
      row.readyForPartNumber = row.partNumberFailed === 0 ? "Y" : "N";
      row.readyForPartName = row.partNameFailed === 0 ? "Y" : "N";
      row.nextAction = suggestProductAction(row);
      return row;
    }
  );

  productSummaryRows.sort((a, b) => a.id.localeCompare(b.id));
  queryRows.sort((a, b) => {
    if (a.id !== b.id) return a.id.localeCompare(b.id);
    return a.priority - b.priority;
  });

  const outDir = path.resolve(process.cwd(), "scripts/firestore/reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "algolia-searchability-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  const excelPath = path.join(outDir, "algolia-searchability-report.xlsx");
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 46 },
    { header: "Value", key: "value", width: 24 },
  ];
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.addRows([
    { metric: "Generated At", value: report.generatedAt },
    {
      metric: "Total Firestore Products",
      value: report.totals.firestoreProducts,
    },
    {
      metric: "Total Checks Evaluated",
      value: report.totals.totalChecksEvaluated,
    },
    {
      metric: "Total Runnable Checks",
      value: report.totals.totalRunnableChecks,
    },
  ]);

  summarySheet.addRow({ metric: "", value: "" });
  summarySheet.addRow({
    metric: "Check Name",
    value: "Pass/Fail/Skipped/Pass Rate",
  });

  for (const [name, counter] of Object.entries(report.checks) as Array<
    [CheckName, CheckCounter]
  >) {
    summarySheet.addRow({
      metric: name,
      value: `${counter.pass}/${counter.fail}/${counter.skipped}/${passRate(
        counter.pass,
        counter.fail
      )}`,
    });
  }

  const productSheet = workbook.addWorksheet("Product Searchability");
  productSheet.columns = [
    { header: "Product ID", key: "id", width: 32 },
    { header: "Brand ID", key: "brandId", width: 16 },
    { header: "Part Number", key: "partNumber", width: 24 },
    { header: "Part Name", key: "partName", width: 34 },
    { header: "Part Number Compact", key: "partNumberCompact", width: 24 },
    { header: "Part Number Alnum Only", key: "partNumberAlnumOnly", width: 24 },
    { header: "Total Checks", key: "totalChecks", width: 12 },
    { header: "Runnable Checks", key: "runnableChecks", width: 14 },
    { header: "Passed", key: "passed", width: 10 },
    { header: "Failed", key: "failed", width: 10 },
    { header: "Skipped", key: "skipped", width: 10 },
    { header: "PartNumber Passed", key: "partNumberPassed", width: 16 },
    { header: "PartNumber Failed", key: "partNumberFailed", width: 16 },
    { header: "PartName Passed", key: "partNamePassed", width: 14 },
    { header: "PartName Failed", key: "partNameFailed", width: 14 },
    { header: "Readiness Score %", key: "readinessScore", width: 18 },
    { header: "Ready For Part Number", key: "readyForPartNumber", width: 20 },
    { header: "Ready For Part Name", key: "readyForPartName", width: 18 },
    { header: "Next Action", key: "nextAction", width: 52 },
  ];
  productSheet.getRow(1).font = { bold: true };
  productSheet.addRows(productSummaryRows);

  const querySheet = workbook.addWorksheet("Query Results");
  querySheet.columns = [
    { header: "Product ID", key: "id", width: 32 },
    { header: "Brand ID", key: "brandId", width: 16 },
    { header: "Part Number", key: "partNumber", width: 24 },
    { header: "Part Name", key: "partName", width: 34 },
    { header: "Part Number Compact", key: "partNumberCompact", width: 24 },
    { header: "Part Number Alnum Only", key: "partNumberAlnumOnly", width: 24 },
    { header: "Check Name", key: "checkName", width: 26 },
    { header: "Check Label", key: "checkLabel", width: 26 },
    { header: "Check Type", key: "checkType", width: 12 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Query", key: "query", width: 24 },
    { header: "Query Length", key: "queryLength", width: 12 },
    { header: "Status", key: "status", width: 10 },
    { header: "Matched Count", key: "matchedCount", width: 14 },
    { header: "Returned Hits", key: "returnedHits", width: 14 },
    { header: "Rank In Returned", key: "rankInReturnedHits", width: 14 },
    {
      header: "Top Returned Object IDs",
      key: "topReturnedObjectIds",
      width: 44,
    },
    { header: "Reason Code", key: "reasonCode", width: 28 },
    { header: "Reason Detail", key: "reasonDetail", width: 56 },
    { header: "Mitigation", key: "mitigation", width: 56 },
    { header: "Has Dot", key: "hasDot", width: 10 },
    { header: "Has Slash", key: "hasSlash", width: 10 },
    { header: "Has Hyphen", key: "hasHyphen", width: 10 },
    { header: "Has Parens", key: "hasParens", width: 10 },
  ];
  querySheet.getRow(1).font = { bold: true };
  querySheet.addRows(queryRows);

  await workbook.xlsx.writeFile(excelPath);

  console.log("\n=== Algolia Searchability Summary ===");
  for (const [name, counter] of Object.entries(report.checks) as Array<
    [CheckName, CheckCounter]
  >) {
    console.log(
      `${name}: pass=${counter.pass}, fail=${counter.fail}, skipped=${
        counter.skipped
      }, passRate=${passRate(counter.pass, counter.fail)}`
    );
  }
  console.log(`Report written to: ${outPath}`);
  console.log(`Excel report written to: ${excelPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
