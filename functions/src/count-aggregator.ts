import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import type { UserData, AccountStatus } from "./types";

const db = getFirestore(getApps()[0]!);

const REGION = defineString("FIRESTORE_REGION", { default: "asia-south1" });
const SERVICE_ACCOUNT = defineString("FUNCTION_SERVICE_ACCOUNT");

// ============================================================================
// PRODUCTS AGGREGATION
// ============================================================================
export const updateProductsCount = onDocumentWritten(
  {
    document: "products/{docId}",
    region: REGION,
    serviceAccount: SERVICE_ACCOUNT,
  },
  async () => {
    const productsRef = db.collection("products");
    const snapshot = await productsRef.get();

    const byBrand: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let noImageCount = 0;
    let totalCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      totalCount++;

      // Count by brand
      if (data.brandId) {
        byBrand[data.brandId] = (byBrand[data.brandId] || 0) + 1;
      }

      // Count by status
      if (data.status) {
        byStatus[data.status] = (byStatus[data.status] || 0) + 1;
      }

      // Count products without image
      if (!data.image || data.image.trim() === "") {
        noImageCount++;
      }
    }

    const countData = {
      total: totalCount,
      noImage: noImageCount,
      byBrand,
      byStatus,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("counters").doc("products").set(countData);
    console.log(
      `✅ Products count updated: ${totalCount} total, ${noImageCount} without image`
    );
  }
);

// ============================================================================
// USERS AGGREGATION
// ============================================================================
export const updateUsersCount = onDocumentWritten(
  {
    document: "users/{uid}",
    region: REGION,
    serviceAccount: SERVICE_ACCOUNT,
  },
  async () => {
    const usersRef = db.collection("users");
    const userGateRef = db.collection("userGate");

    const usersSnapshot = await usersRef.get();
    const userGateSnapshot = await userGateRef.get();

    let totalCount = 0;
    let approvedCount = 0;
    let activeCount = 0;
    const byBusinessType: Record<string, number> = {};
    const byAccountStatus: Record<string, number> = {};

    // Build userGate status map
    const gateMap = new Map<string, AccountStatus>();
    for (const doc of userGateSnapshot.docs) {
      const data = doc.data();
      if (data.status) {
        gateMap.set(doc.id, data.status);
      }
    }

    // Count users
    for (const doc of usersSnapshot.docs) {
      const data = doc.data() as UserData;
      totalCount++;

      // Count by business type
      if (data.businessType) {
        byBusinessType[data.businessType] =
          (byBusinessType[data.businessType] || 0) + 1;
      }

      // Get status from userGate
      const status = gateMap.get(doc.id) || "unknown";
      byAccountStatus[status] = (byAccountStatus[status] || 0) + 1;

      // Count approved
      if (status === "approved") {
        approvedCount++;
      }

      // Count active (approved users without suspension/deactivation)
      if (status === "approved" || status === "pending") {
        activeCount++;
      }
    }

    const countData = {
      total: totalCount,
      approved: approvedCount,
      active: activeCount,
      byBusinessType,
      byAccountStatus,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("counters").doc("users").set(countData);
    console.log(
      `✅ Users count updated: ${totalCount} total, ${approvedCount} approved, ${activeCount} active`
    );
  }
);

// ============================================================================
// ORDERS AGGREGATION
// ============================================================================
export const updateOrdersCount = onDocumentWritten(
  {
    document: "orders/{docId}",
    region: REGION,
    serviceAccount: SERVICE_ACCOUNT,
  },
  async () => {
    const ordersRef = db.collection("orders");
    const snapshot = await ordersRef.get();

    let totalCount = 0;
    const byStatus: Record<string, number> = {};
    const byUserId: Record<string, number> = {};

    for (const doc of snapshot.docs) {
      const data = doc.data();
      totalCount++;

      // Count by status
      if (data.status) {
        byStatus[data.status] = (byStatus[data.status] || 0) + 1;
      }

      // Count by user
      if (data.user?.uid) {
        const userId = data.user.uid;
        byUserId[userId] = (byUserId[userId] || 0) + 1;
      }
    }

    const countData = {
      total: totalCount,
      byStatus,
      byUserId,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("counters").doc("orders").set(countData);
    console.log(`✅ Orders count updated: ${totalCount} total`);
  }
);

// ============================================================================
// ENQUIRIES AGGREGATION
// ============================================================================
export const updateEnquiriesCount = onDocumentWritten(
  {
    document: "enquiries/{docId}",
    region: REGION,
    serviceAccount: SERVICE_ACCOUNT,
  },
  async () => {
    const enquiriesRef = db.collection("enquiries");
    const snapshot = await enquiriesRef.get();

    let totalCount = 0;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byUserId: Record<string, number> = {};

    for (const doc of snapshot.docs) {
      const data = doc.data();
      totalCount++;

      // Count by status
      if (data.status) {
        byStatus[data.status] = (byStatus[data.status] || 0) + 1;
      }

      // Count by priority
      if (data.priority) {
        byPriority[data.priority] = (byPriority[data.priority] || 0) + 1;
      }

      // Count by user
      if (data.userId) {
        byUserId[data.userId] = (byUserId[data.userId] || 0) + 1;
      }
    }

    const countData = {
      total: totalCount,
      byStatus,
      byPriority,
      byUserId,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("counters").doc("enquiries").set(countData);
    console.log(`✅ Enquiries count updated: ${totalCount} total`);
  }
);

// ============================================================================
// BRANDS AGGREGATION
// ============================================================================
export const updateBrandsCount = onDocumentWritten(
  {
    document: "brands/{docId}",
    region: REGION,
    serviceAccount: SERVICE_ACCOUNT,
  },
  async () => {
    const brandsRef = db.collection("brands");
    const snapshot = await brandsRef.get();

    let totalCount = 0;

    for (const doc of snapshot.docs) {
      if (doc.exists) {
        totalCount++;
      }
    }

    const countData = {
      total: totalCount,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("counters").doc("brands").set(countData);
    console.log(`✅ Brands count updated: ${totalCount} total`);
  }
);
