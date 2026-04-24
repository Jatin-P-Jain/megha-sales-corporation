import fs from "node:fs";
import path from "node:path";

import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";

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

async function waitForTask(
  client: ReturnType<typeof algoliasearch>,
  indexName: string,
  taskID: number,
  timeoutMs = 120000
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const task = await client.getTask({ indexName, taskID });
    if (task.status === "published") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for task ${taskID} on index ${indexName}`);
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

  const appId =
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID;
  const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const fromIndex = parseArg("--from") || "products_tmp";
  const toIndex = parseArg("--to") || "products";

  if (!appId || !adminApiKey) {
    throw new Error(
      "Missing Algolia credentials. Set NEXT_PUBLIC_ALGOLIA_APP_ID (or ALGOLIA_APP_ID) and ALGOLIA_ADMIN_API_KEY."
    );
  }

  if (fromIndex === toIndex) {
    throw new Error("Source and destination indexes must be different.");
  }

  const algolia = algoliasearch(appId, adminApiKey);

  const sourceExists = await algolia.indexExists({ indexName: fromIndex });
  if (!sourceExists) {
    throw new Error(`Source index does not exist: ${fromIndex}`);
  }

  console.log(`Moving Algolia index ${fromIndex} -> ${toIndex}`);
  const response = await algolia.operationIndex({
    indexName: fromIndex,
    operationIndexParams: {
      operation: "move",
      destination: toIndex,
    },
  });

  if (typeof response.taskID === "number") {
    await waitForTask(algolia, toIndex, response.taskID);
  }

  console.log(`Move completed: ${fromIndex} -> ${toIndex}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
