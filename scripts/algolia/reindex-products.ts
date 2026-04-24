import fs from "node:fs";
import path from "node:path";

import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";
import admin from "firebase-admin";

type ProductDoc = {
  id?: string;
  partNumber?: string;
};

type AlgoliaProductRecord = Record<string, unknown> & {
  objectID: string;
  id: string;
  partNumberRaw: string;
  partNumberCompact: string;
  partNumberAlnum: string;
  partNumberAlnumSpaced: string;
  partNumberSegments: string[];
  partNumberInfixTokens: string[];
  partNameNormalized: string;
};

function loadEnvFromLocalFiles(): void {
  for (const file of [
    ".env.local",
    ".env.production.local",
    ".env.development.local",
  ]) {
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

function removeNonAlphaNumeric(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "");
}

function addAlphaNumSpaces(value: string): string {
  return normalizeSpaces(
    value
      .replace(/([A-Za-z])(\d)/g, "$1 $2")
      .replace(/(\d)([A-Za-z])/g, "$1 $2")
  );
}

function toLowerSafe(value: string): string {
  return value.toLowerCase();
}

function buildPartNumberSegments(partNumberRaw: string): string[] {
  const bySeparators = partNumberRaw
    .split(/[^A-Za-z0-9]+/)
    .map((segment) => toLowerSafe(segment.trim()))
    .filter((segment) => segment.length >= 2);

  const unique = new Set<string>(bySeparators);
  return Array.from(unique).slice(0, 40);
}

function buildInfixTokens(
  partNumberAlnum: string,
  minGram = 2,
  maxGram = 8,
  maxTokens = 300
): string[] {
  const tokens = new Set<string>();
  const clean = toLowerSafe(partNumberAlnum);

  // Generate suffix tokens first (last 20 positions) to guarantee suffix coverage
  // even for very long part numbers that would otherwise hit the maxTokens cap.
  const suffixStartFrom = Math.max(0, clean.length - 20);
  for (let start = suffixStartFrom; start < clean.length; start++) {
    for (let size = minGram; size <= maxGram; size++) {
      const end = start + size;
      if (end > clean.length) {
        break;
      }
      tokens.add(clean.slice(start, end));
    }
  }

  // Fill remaining capacity with prefix and middle tokens (left to right)
  for (let start = 0; start < suffixStartFrom; start++) {
    for (let size = minGram; size <= maxGram; size++) {
      const end = start + size;
      if (end > clean.length) {
        break;
      }
      tokens.add(clean.slice(start, end));
      if (tokens.size >= maxTokens) {
        return Array.from(tokens);
      }
    }
  }

  return Array.from(tokens);
}

function parseArg(flag: string): string | undefined {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

  const appId =
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID;
  const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const indexName =
    parseArg("--index") || process.env.ALGOLIA_INDEX || "products_tmp";
  const serviceAccountPath =
    parseArg("--service-account") ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "serviceAccount.prod.json";

  if (!appId || !adminApiKey) {
    throw new Error(
      "Missing Algolia credentials. Set NEXT_PUBLIC_ALGOLIA_APP_ID (or ALGOLIA_APP_ID) and ALGOLIA_ADMIN_API_KEY."
    );
  }

  const absoluteServiceAccountPath = path.resolve(
    process.cwd(),
    serviceAccountPath
  );
  if (!fs.existsSync(absoluteServiceAccountPath)) {
    throw new Error(
      `Missing service account file: ${absoluteServiceAccountPath}`
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(absoluteServiceAccountPath, "utf8")
  );

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const algolia = algoliasearch(appId, adminApiKey);

  console.log(`Fetching Firestore products from collection: products`);
  const productsSnap = await db.collection("products").get();
  console.log(`Firestore products fetched: ${productsSnap.size}`);

  const objects: AlgoliaProductRecord[] = productsSnap.docs.map((doc) => {
    const data = doc.data() as ProductDoc & Record<string, unknown>;

    const partNumberRaw = normalizeSpaces(String(data.partNumber || ""));
    const partNumberCompact = toLowerSafe(removeSpaces(partNumberRaw));
    const partNumberAlnum = toLowerSafe(removeNonAlphaNumeric(partNumberRaw));
    const partNumberAlnumSpaced = addAlphaNumSpaces(partNumberAlnum);
    const partNameRaw = normalizeSpaces(
      String((data as Record<string, unknown>).partName || "")
    );
    const partNameNormalized = toLowerSafe(removeNonAlphaNumeric(partNameRaw));

    return {
      ...data,
      objectID: doc.id,
      id: String(data.id || doc.id),
      partNumberRaw,
      partNumberCompact,
      partNumberAlnum,
      partNumberAlnumSpaced,
      partNumberSegments: buildPartNumberSegments(partNumberRaw),
      partNumberInfixTokens: buildInfixTokens(partNumberAlnum),
      partNameNormalized,
    };
  });

  console.log(
    `Preparing to write ${objects.length} records to Algolia index: ${indexName}`
  );
  await algolia.clearObjects({ indexName });

  const objectChunks = chunk(objects, 500);
  for (let i = 0; i < objectChunks.length; i++) {
    const current = objectChunks[i];
    await algolia.saveObjects({
      indexName,
      objects: current,
    });
    if ((i + 1) % 5 === 0 || i === objectChunks.length - 1) {
      console.log(`Saved chunk ${i + 1}/${objectChunks.length}`);
    }
  }

  console.log(`Reindex complete for ${indexName}`);
  console.log(`No Firestore documents were modified.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
