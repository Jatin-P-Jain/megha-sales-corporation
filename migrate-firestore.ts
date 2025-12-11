//RUN:: npx tsx migrate-firestore.ts

import admin, { firestore } from "firebase-admin";

// 🔁 Initialize source (DEV)
const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./serviceAccount.prod.json")),
  },
  "prodApp",
);
const sourceDb = sourceApp.firestore();

// ✅ Initialize target (PROD)
const targetApp = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./serviceAccount.dev.json")),
  },
  "devApp",
);
const targetDb = targetApp.firestore();

// 📦 Collections to migrate
const collectionsToMigrate = ["brands", "products", "users"];

async function migrateCollection(collectionName: string) {
  console.log(`🚚 Migrating ${collectionName}...`);
  const snapshot = await sourceDb.collection(collectionName).get();

  const batch = targetDb.batch();
  snapshot.forEach((doc) => {
    const ref = targetDb.collection(collectionName).doc(doc.id);
    batch.set(ref, doc.data());
  });

  await batch.commit();
  console.log(`✅ ${collectionName} migrated (${snapshot.size} documents).`);
}

async function migrateAll() {
  for (const name of collectionsToMigrate) {
    await migrateCollection(name);
  }

  console.log("🎉 All migrations complete.");
}

// migrateAll().catch((err) => {
//   console.error("❌ Migration failed:", err);
// });

async function replaceHyphensInProducts() {
  const productsCol = sourceDb.collection("products");
  const snapshot = await productsCol.get();

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const docId = doc.id;
    if (docId.includes("-")) {
      const newDocId = docId.replace(/-/g, "");
      let data = doc.data();

      // Remove hyphens in id and part_number fields if present
      if (typeof data.id === "string") {
        data.id = data.id.replace(/-/g, "");
      }
      if (typeof data.partNumber === "string") {
        data.partNumber = data.partNumber.replace(/ /g, "");
      }

      // Write to new doc and delete the old one
      await productsCol.doc(newDocId).set(data);
      await doc.ref.delete();

      console.log(`Migrated doc: ${docId} ➔ ${newDocId}`);
      updatedCount++;
    }
  }

  console.log(`✅ All done. ${updatedCount} products updated.`);
}
async function changeFieldInProducts() {
  const productsCol = sourceDb.collection("products");
  const snapshot = await productsCol.get();
  let batch = sourceDb.batch();

  let updatedCount = 0;
  let ops = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Example condition: only update if status === "for-sale"
    // Replace with your real condition logic

    // const shouldUpdate = data?.brandId === "accurub" && (data?.partCategory === "V-Rod" || data?.partCategory === "Torque Rod") && data?.partNumber === "Assembly" && data?.gst === 28;
    const shouldUpdate = data?.brandId === "accurub";

    console.log(
      `Part Number ${data?.partNumber} shouldUpdate: ${shouldUpdate}`,
    );

    if (shouldUpdate) {
      // Example update: set featured flag and normalize partNumber
      const updates: FirebaseFirestore.UpdateData<{ [field: string]: any }> = {
        image: "",
      };
      batch.update(doc.ref, updates);
      
      updatedCount++;
      ops++;

      // Commit every 450-475 ops to stay under 500 writes/commit
      if (ops >= 450) {
        await batch.commit();
        batch = sourceDb.batch();
        ops = 0;
      }
    }
    if (ops > 0) {
      await batch.commit();
      batch = sourceDb.batch();
      ops = 0;
    }
  }

  console.log(`✅ All done. ${updatedCount} products updated.`);
}
export async function archiveProducts() {
  const db = sourceDb as FirebaseFirestore.Firestore; // ensure admin initialized
  const srcCol = db.collection("products");
  const dstCol = db.collection("archive").doc("products").collection("items"); // Archive/products/items

  const qSnap = await srcCol.where("brandId", "==", "mansarovar").get();

  const MAX = 450; // stay under 500 ops per batch
  let batch = db.batch();
  let ops = 0;
  let moved = 0;

  for (const doc of qSnap.docs) {
    const data = doc.data();

    // 1) write copy in Archive/Product using same id
    const dstRef = dstCol.doc(doc.id);
    batch.set(dstRef, {
      ...data,
      archivedAt: firestore.FieldValue.serverTimestamp(),
    });

    // 2) delete original
    batch.delete(doc.ref);

    ops += 2; // two writes per doc
    moved++;

    if (ops >= MAX) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(
    `✅ Moved ${moved} product(s) to Archive/Product and deleted originals.`,
  );
}
export async function moveProducts() {
  const db = sourceDb as FirebaseFirestore.Firestore; // ensure admin initialized
  const srcCol = db.collection("archive").doc("products").collection("items"); // Archive/products/items
  const dstCol = db.collection("products");
  const productIdsToMove = [
    "M-904-I",
    "M-905-I",
    "M-907-I",
    "MH-906",
    "MH-908",
    "MH-910",
  ]; // Example IDs to move
  const qSnap = await srcCol.where("id", "in", productIdsToMove).get();

  const MAX = 450; // stay under 500 ops per batch
  let batch = db.batch();
  let ops = 0;
  let moved = 0;

  for (const doc of qSnap.docs) {
    const data = doc.data();

    // 1) write copy in Archive/Product using same id
    const dstRef = dstCol.doc(doc.id);
    batch.set(dstRef, {
      ...data,
    });

    // 2) delete original
    batch.delete(doc.ref);

    ops += 2; // two writes per doc
    moved++;

    if (ops >= MAX) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(
    `✅ Moved ${moved} product(s) to Archive/Product and deleted originals.`,
  );
}

// Usage
// replaceHyphensInProducts().catch(console.error);
changeFieldInProducts().catch(console.error);
// archiveProducts().catch(console.error);
// moveProducts().catch(console.error);
