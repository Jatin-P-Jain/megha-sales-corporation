import fs from "node:fs";
import path from "node:path";

import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";

type GenericSettings = Record<string, unknown>;

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

function parseArg(flag: string): string | undefined {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

  const appId =
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID;
  const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const indexName =
    parseArg("--index") || process.env.ALGOLIA_INDEX || "products_tmp";

  if (!appId || !adminApiKey) {
    throw new Error(
      "Missing Algolia credentials. Set NEXT_PUBLIC_ALGOLIA_APP_ID (or ALGOLIA_APP_ID) and ALGOLIA_ADMIN_API_KEY."
    );
  }

  const algolia = algoliasearch(appId, adminApiKey);

  const existingSettings = (await algolia.getSettings({
    indexName,
  })) as GenericSettings;

  const existingFacets = Array.isArray(existingSettings.attributesForFaceting)
    ? (existingSettings.attributesForFaceting as string[])
    : [];

  const searchableAttributes = [
    "unordered(partNumberRaw)",
    "unordered(partNumberCompact)",
    "unordered(partNumberAlnum)",
    "unordered(partNumberAlnumSpaced)",
    "unordered(partNumberSegments)",
    "unordered(partNumberInfixTokens)",
    "unordered(partNumber)",
    "unordered(partNameNormalized)",
    "unordered(partName)",
  ];

  const nextSettings: GenericSettings = {
    ...existingSettings,
    searchableAttributes,
    attributesForFaceting: uniqueStrings([
      ...existingFacets,
      "filterOnly(brandId)",
      "filterOnly(status)",
    ]),
    disableTypoToleranceOnAttributes: uniqueStrings([
      "partNumberRaw",
      "partNumberCompact",
      "partNumberAlnum",
      "partNumberAlnumSpaced",
      "partNumberInfixTokens",
      "partNameNormalized",
    ]),
  };

  await algolia.setSettings({
    indexName,
    indexSettings: nextSettings,
  });

  console.log(`Configured Algolia settings for index: ${indexName}`);
  console.log(`Searchable attributes now prioritize part-number variants.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
