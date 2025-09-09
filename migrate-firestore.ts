//RUN:: npx tsx migrate-firestore.ts

import admin from "firebase-admin";

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
    console.log(`Current brandName for doc ${doc.id}: ${data?.brandName}`);

    const shouldUpdate = data?.brandName === "ASK ";

    console.log(`Checking doc ${doc.id}, shouldUpdate: ${shouldUpdate}`);

    if (shouldUpdate) {
      // Example update: set featured flag and normalize partNumber
      const updates: FirebaseFirestore.UpdateData<{ [field: string]: any }> = {
        brandId: "ask-fras-le",
        brandName: "ASK"
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

// Usage
// replaceHyphensInProducts().catch(console.error);
changeFieldInProducts().catch(console.error);
