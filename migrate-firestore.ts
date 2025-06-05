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

migrateAll().catch((err) => {
  console.error("❌ Migration failed:", err);
});
