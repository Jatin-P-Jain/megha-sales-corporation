//RUN:: npx tsx migrate-firestore.ts
/* eslint-disable */

import admin from "firebase-admin";

const sourceApp = admin.initializeApp(
  { credential: admin.credential.cert(require("./serviceAccount.prod.json")) },
  "prodApp"
);
const prodDb = sourceApp.firestore();

// Toggle here (no CLI flags)
const DRY_RUN = false;

type ProductDoc = { brandId?: string; partNumber?: string };

function splitTextNumberWithSpace(input: string): string {
  const s = String(input ?? "").trim();
  if (!s) return s;
  return s
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

async function updateAutokoiPartNumbers() {
  const pageSize = 500;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  let scanned = 0;
  let changed = 0;

  while (true) {
    let q = prodDb
      .collection("products")
      .where("brandId", "==", "autokoi") // filtered query [web:45]
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    let batch = prodDb.batch();
    let ops = 0;

    for (const doc of snap.docs) {
      scanned++;

      const data = doc.data() as ProductDoc;
      const current = (data.partNumber ?? "").trim();
      if (!current) continue;

      const next = splitTextNumberWithSpace(current);
      if (next === current) continue;
      console.log(`Updating - ${doc.ref.path}: "${current}" -> "${next}"`);

      batch.update(doc.ref, { partNumber: next });
      ops++;
      changed++;

      // keep under typical batch sizing; commit sequentially [web:54]
      if (ops === 450) {
        if (!DRY_RUN) await batch.commit(); // commit batched writes [web:54]
        batch = prodDb.batch();
        ops = 0;
      }
    }

    if (ops > 0) {
      if (!DRY_RUN) await batch.commit(); // commit batched writes [web:54]
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  }

  // Reporting
  console.log(
    `dryRun=${DRY_RUN} scanned=${scanned} changed=${changed} (committed=${!DRY_RUN})`
  );
}

updateAutokoiPartNumbers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
