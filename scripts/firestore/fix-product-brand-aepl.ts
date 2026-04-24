import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

type ProductData = {
  brandId?: string;
  brandName?: string;
  partNumber?: string;
  partName?: string;
};

const SOURCE_BRAND_ID = "aepl";
const TARGET_BRAND_ID = "acey-aepl";

function hasApplyFlag() {
  return process.argv.includes("--apply");
}

async function main() {
  const apply = hasApplyFlag();

  const serviceAccountPath = path.join(process.cwd(), "serviceAccount.prod.json");
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8"),
  ) as admin.ServiceAccount;

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = app.firestore();

  const targetBrandSnap = await db.collection("brands").doc(TARGET_BRAND_ID).get();
  if (!targetBrandSnap.exists) {
    throw new Error(
      `Target brand '${TARGET_BRAND_ID}' does not exist in brands collection.`,
    );
  }

  const targetBrandName = String(targetBrandSnap.data()?.brandName || "").trim();

  const snap = await db
    .collection("products")
    .where("brandId", "==", SOURCE_BRAND_ID)
    .get();

  console.log(`Mode: ${apply ? "APPLY" : "DRY_RUN"}`);
  console.log(`Found ${snap.size} products with brandId='${SOURCE_BRAND_ID}'.`);

  if (snap.empty) {
    await app.delete();
    return;
  }

  const refs = snap.docs.map((d) => d.ref.path);
  refs.forEach((ref, idx) => console.log(`${idx + 1}. ${ref}`));

  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as ProductData;

    const payload: Partial<ProductData> = {
      brandId: TARGET_BRAND_ID,
      ...(targetBrandName ? { brandName: targetBrandName } : {}),
    };

    console.log(
      `- ${doc.id}: ${data.partNumber || ""} | ${data.partName || ""} | brandId ${data.brandId} -> ${TARGET_BRAND_ID}`,
    );

    if (apply) {
      batch.update(doc.ref, payload);
      ops += 1;
      updated += 1;

      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (apply && ops > 0) {
    await batch.commit();
  }

  if (apply) {
    console.log(`Updated ${updated} product(s).`);

    const verifyOld = await db
      .collection("products")
      .where("brandId", "==", SOURCE_BRAND_ID)
      .get();

    const verifyNew = await db
      .collection("products")
      .where("brandId", "==", TARGET_BRAND_ID)
      .get();

    console.log(`Verification: remaining '${SOURCE_BRAND_ID}' products = ${verifyOld.size}`);
    console.log(`Verification: total '${TARGET_BRAND_ID}' products = ${verifyNew.size}`);
  }

  await app.delete();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
