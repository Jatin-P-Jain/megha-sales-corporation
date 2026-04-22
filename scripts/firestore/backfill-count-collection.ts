/**
 * 🔄 BACKFILL COUNT COLLECTION
 *
 * This script backfills the `count` collection with aggregated metrics
 * from all existing collections (products, users, orders, enquiries, brands).
 *
 * Run with: npx tsx scripts/firestore/backfill-count-collection.ts
 */

import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
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

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

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
  console.log("🔄 Starting backfill of count collection...\n");

  // ========================================================================
  // PRODUCTS
  // ========================================================================
  console.log("📦 Processing products...");
  const productsRef = db.collection("products");
  const productsSnapshot = await productsRef.get();

  const byBrand: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let noImageCount = 0;

  for (const doc of productsSnapshot.docs) {
    const data = doc.data();

    if (data.brandId) {
      byBrand[data.brandId] = (byBrand[data.brandId] || 0) + 1;
    }

    if (data.status) {
      byStatus[data.status] = (byStatus[data.status] || 0) + 1;
    }

    if (!data.image || data.image.trim() === "") {
      noImageCount++;
    }
  }

  const productsCount = {
    total: productsSnapshot.size,
    noImage: noImageCount,
    byBrand,
    byStatus,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("count").doc("products").set(productsCount);
  console.log(
    `✅ Products: ${productsSnapshot.size} total, ${noImageCount} without image\n`
  );

  // ========================================================================
  // USERS
  // ========================================================================
  console.log("👥 Processing users...");
  const usersRef = db.collection("users");
  const userGateRef = db.collection("userGate");

  const usersSnapshot = await usersRef.get();
  const userGateSnapshot = await userGateRef.get();

  let approvedCount = 0;
  let activeCount = 0;
  const byBusinessType: Record<string, number> = {};
  const byAccountStatus: Record<string, number> = {};

  const gateMap = new Map<string, string>();
  for (const doc of userGateSnapshot.docs) {
    const data = doc.data();
    if (data.status) {
      gateMap.set(doc.id, data.status);
    }
  }

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();

    if (data.businessType) {
      byBusinessType[data.businessType] =
        (byBusinessType[data.businessType] || 0) + 1;
    }

    const status = gateMap.get(doc.id) || "unknown";
    byAccountStatus[status] = (byAccountStatus[status] || 0) + 1;

    if (status === "approved") {
      approvedCount++;
    }

    if (status === "approved" || status === "pending") {
      activeCount++;
    }
  }

  const usersCount = {
    total: usersSnapshot.size,
    approved: approvedCount,
    active: activeCount,
    byBusinessType,
    byAccountStatus,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("count").doc("users").set(usersCount);
  console.log(
    `✅ Users: ${usersSnapshot.size} total, ${approvedCount} approved, ${activeCount} active\n`
  );

  // ========================================================================
  // ORDERS
  // ========================================================================
  console.log("📋 Processing orders...");
  const ordersRef = db.collection("orders");
  const ordersSnapshot = await ordersRef.get();

  const ordersByStatus: Record<string, number> = {};
  const ordersByUserId: Record<string, number> = {};

  for (const doc of ordersSnapshot.docs) {
    const data = doc.data();

    if (data.status) {
      ordersByStatus[data.status] = (ordersByStatus[data.status] || 0) + 1;
    }

    if (data.user?.uid) {
      const userId = data.user.uid;
      ordersByUserId[userId] = (ordersByUserId[userId] || 0) + 1;
    }
  }

  const ordersCount = {
    total: ordersSnapshot.size,
    byStatus: ordersByStatus,
    byUserId: ordersByUserId,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("count").doc("orders").set(ordersCount);
  console.log(`✅ Orders: ${ordersSnapshot.size} total\n`);

  // ========================================================================
  // ENQUIRIES
  // ========================================================================
  console.log("💬 Processing enquiries...");
  const enquiriesRef = db.collection("enquiries");
  const enquiriesSnapshot = await enquiriesRef.get();

  const enquiriesByStatus: Record<string, number> = {};
  const enquiriesByPriority: Record<string, number> = {};
  const enquiriesByUserId: Record<string, number> = {};

  for (const doc of enquiriesSnapshot.docs) {
    const data = doc.data();

    if (data.status) {
      enquiriesByStatus[data.status] =
        (enquiriesByStatus[data.status] || 0) + 1;
    }

    if (data.priority) {
      enquiriesByPriority[data.priority] =
        (enquiriesByPriority[data.priority] || 0) + 1;
    }

    if (data.userId) {
      enquiriesByUserId[data.userId] =
        (enquiriesByUserId[data.userId] || 0) + 1;
    }
  }

  const enquiriesCount = {
    total: enquiriesSnapshot.size,
    byStatus: enquiriesByStatus,
    byPriority: enquiriesByPriority,
    byUserId: enquiriesByUserId,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("count").doc("enquiries").set(enquiriesCount);
  console.log(`✅ Enquiries: ${enquiriesSnapshot.size} total\n`);

  // ========================================================================
  // BRANDS
  // ========================================================================
  console.log("🏷️ Processing brands...");
  const brandsRef = db.collection("brands");
  const brandsSnapshot = await brandsRef.get();

  const brandsCount = {
    total: brandsSnapshot.size,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("count").doc("brands").set(brandsCount);
  console.log(`✅ Brands: ${brandsSnapshot.size} total\n`);

  console.log("🎉 Backfill complete! Count collection is now populated.\n");
  console.log("📊 Summary:");
  console.log(
    `   Products: ${productsCount.total} | Users: ${usersCount.total} | Orders: ${ordersCount.total} | Enquiries: ${enquiriesCount.total} | Brands: ${brandsCount.total}`
  );
}

main().catch((error) => {
  console.error("❌ Backfill failed:", error);
  process.exit(1);
});
