/* eslint-disable */
/**
 * Sets `image` field on specific products (by partNumber) to the
 * acey-aepl accelerator cable image path.
 *
 * DRY RUN (default):
 *   npx tsx scripts/firestore/set-product-image-acey-aepl-accelerator.ts
 *
 * APPLY:
 *   npx tsx scripts/firestore/set-product-image-acey-aepl-accelerator.ts --apply
 */

import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

const TARGET_IMAGE =
  "products/super-circle/brake-pads/WhatsApp Image 2025-11-21 at 19.13.58.jpeg";

const PART_NUMBERS = [
  "C2112SP",
  "C2629SP",
  "C2739SP",
  "C3440SP",
  "C3854",
  "C4462SP",
  "C5159SP",
  "P2341",
  "P2440",
  "R5070",
  "S5575",
  "VW0817SP",
  "VW0917SP",
];

function hasApplyFlag() {
  return process.argv.includes("--apply");
}

// Firestore `in` queries are limited to 30 items per query (was 10, raised to 30 in 2023).
// We use 10 to be safe with older SDK versions.
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const apply = hasApplyFlag();

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

  console.log(`Mode: ${apply ? "APPLY" : "DRY_RUN"}`);
  console.log(`Target image: ${TARGET_IMAGE}`);
  console.log(`Looking up ${PART_NUMBERS.length} part numbers...\n`);

  const partNumberChunks = chunk(PART_NUMBERS, 10);
  const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

  for (const chunk of partNumberChunks) {
    const snap = await db
      .collection("products")
      .where("partNumber", "in", chunk)
      .get();
    allDocs.push(...snap.docs);
  }

  console.log(`Found ${allDocs.length} matching document(s).\n`);

  // Track which part numbers were NOT found
  const foundPartNumbers = new Set(
    allDocs.map((d) => (d.data().partNumber as string) ?? "")
  );
  const notFound = PART_NUMBERS.filter((pn) => !foundPartNumbers.has(pn));

  // Print found docs
  for (const doc of allDocs) {
    const data = doc.data();
    const currentImage = data.image ?? "(none)";
    console.log(
      `✓ ${doc.id} | partNumber: ${data.partNumber} | image: "${currentImage}" -> "${TARGET_IMAGE}"`
    );
  }

  if (notFound.length > 0) {
    console.log(
      `\n⚠ ${notFound.length} part number(s) NOT found in Firestore:`
    );
    notFound.forEach((pn) => console.log(`  - ${pn}`));
  }

  if (!apply) {
    console.log(
      `\nDry run complete. Run with --apply to commit ${allDocs.length} update(s).`
    );
    await app.delete();
    return;
  }

  // Apply updates in batches
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of allDocs) {
    batch.update(doc.ref, { image: TARGET_IMAGE });
    ops += 1;
    updated += 1;

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`\nApplied. Updated ${updated} product(s).`);
  await app.delete();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
