# 📊 Automated Counters Collection Aggregator

This system automatically maintains aggregated metrics in a `counters` collection in Firestore. Each time a document is written to **products**, **users**, **orders**, **enquiries**, or **brands**, the corresponding count document is updated with real-time aggregated statistics.

## 📋 Overview

### Collections Tracked

#### **Products** (`counters/products`)
```json
{
  "total": 2240,
  "noImage": 45,
  "byBrand": {
    "autokoi": 150,
    "accurub": 120,
    "...": "..."
  },
  "byStatus": {
    "for-sale": 2100,
    "discontinued": 80,
    "out-of-stock": 60
  },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

#### **Users** (`counters/users`)
```json
{
  "total": 320,
  "approved": 285,
  "active": 210,
  "byBusinessType": {
    "retailer": 180,
    "wholesaler": 100,
    "distributor": 40
  },
  "byAccountStatus": {
    "approved": 285,
    "pending": 20,
    "rejected": 10,
    "suspended": 5
  },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

#### **Orders** (`counters/orders`)
```json
{
  "total": 1050,
  "byStatus": {
    "pending": 80,
    "packing": 45,
    "shipped": 600,
    "delivered": 300,
    "cancelled": 25
  },
  "byUserId": {
    "user123": 5,
    "user456": 3,
    "...": "..."
  },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

#### **Enquiries** (`counters/enquiries`)
```json
{
  "total": 245,
  "byStatus": {
    "open": 80,
    "in-progress": 45,
    "resolved": 120
  },
  "byPriority": {
    "high": 25,
    "medium": 120,
    "low": 100
  },
  "byUserId": {
    "user123": 2,
    "user456": 1,
    "...": "..."
  },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

#### **Brands** (`counters/brands`)
```json
{
  "total": 12,
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

---

## 🚀 Setup

### Step 1: Deploy Cloud Functions

The Cloud Functions are defined in `functions/src/count-aggregator.ts` and exported from `functions/src/index.ts`.

To deploy:
```bash
npm run count:deploy
```

Or manually:
```bash
cd functions
npm run deploy
```

### Step 2: Backfill Existing Data

Run the backfill script to populate the counters collection with current data:

```bash
npm run count:backfill
```

This will:
- Count all products by brand and status
- Count all users by business type and account status
- Count all orders by status
- Count all enquiries by status and priority
- Count all brands

**Note**: The backfill is a one-time operation. After that, the Cloud Functions automatically keep the counts in sync.

---

## 📖 How It Works

### Cloud Functions

Each collection has a corresponding Firestore trigger that listens for any write (create, update, delete) operations:

1. **`updateProductsCount`** — Triggers on `products/{docId}` writes
2. **`updateUsersCount`** — Triggers on `users/{uid}` writes
3. **`updateOrdersCount`** — Triggers on `orders/{docId}` writes
4. **`updateEnquiriesCount`** — Triggers on `enquiries/{docId}` writes
5. **`updateBrandsCount`** — Triggers on `brands/{docId}` writes

When triggered, each function:
1. Reads the entire collection
2. Aggregates metrics (counts, groupings by status/brand/user)
3. Writes the result to the corresponding `counters/{collection}` document

### Performance Considerations

- **Full Collection Scans**: Each trigger reads the entire collection. For collections with 10K+ documents, this could add latency.
- **Eventual Consistency**: Updates are not instantaneous but typically complete within 1-2 seconds.
- **Cost**: Each update costs 1 read + 1 write. With high traffic, costs scale linearly.

### Optimization Options

If you experience performance issues, consider:

1. **Distributed Counters** (if counts exceed 100K+ updates/second):
   - Shard the count into multiple shards that are later summed.
   - Firebase Cloud Functions supports this pattern.

2. **Batch Writes**:
   - Throttle count updates to batch writes every N seconds instead of immediate updates.

3. **Selective Aggregation**:
   - Only aggregate fields that have actually changed (e.g., skip by-brand count if brandId wasn't modified).

---

## 📊 Querying the Counters Collection

### From the Frontend (Firestore Client SDK)

```typescript
import { collection, doc, getDoc } from "firebase/firestore";
import { firestore } from "@/firebase/client";

// Get product counts
const countRef = doc(collection(firestore, "count"), "products");
const countSnap = await getDoc(countRef);
const counts = countSnap.data();

console.log(`Total products: ${counts.total}`);
console.log(`Products without image: ${counts.noImage}`);
console.log(`By brand:`, counts.byBrand);
```

### From the Backend (Firebase Admin SDK)

```typescript
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// Get user counts
const countRef = db.collection("counters").doc("users");
const countSnap = await countRef.get();
const counts = countSnap.data();

console.log(`Total users: ${counts.total}`);
console.log(`Approved users: ${counts.approved}`);
console.log(`Active users: ${counts.active}`);
```

---

## 🛠️ Troubleshooting

### Counts are stale

1. Check the `updatedAt` timestamp in the count document.
2. If it hasn't updated in the last 5 minutes, check Cloud Functions logs:
   ```bash
   gcloud functions log read updateProductsCount --limit 50
   ```
3. If functions aren't deployed, deploy them:
   ```bash
   npm run count:deploy
   ```

### Counts are incorrect

1. Run the backfill to recalculate from scratch:
   ```bash
   npm run count:backfill
   ```
2. Wait a few seconds for any in-flight updates to complete, then backfill again.

### Too many reads/writes

If you're concerned about Firestore costs:

1. **Reduce granularity**: Don't track `byUserId` for large collections like products.
2. **Use regional databases**: If your Firestore is multi-region, costs are lower with regional replication.
3. **Monitor usage**: Check Firestore usage in the Firebase console.

---

## 📝 API Reference

### Count Document Structure

```typescript
interface CountDocument {
  total: number; // Total documents in collection
  [key: string]: number | Record<string, number> | string; // Aggregated metrics
  updatedAt: string; // ISO timestamp of last update
}
```

### Cloud Functions

All functions export the following event handlers:

```typescript
export const updateProductsCount: CloudFunction<...>;
export const updateUsersCount: CloudFunction<...>;
export const updateOrdersCount: CloudFunction<...>;
export const updateEnquiriesCount: CloudFunction<...>;
export const updateBrandsCount: CloudFunction<...>;
```

---

## 📌 Next Steps

1. ✅ Deploy Cloud Functions: `npm run count:deploy`
2. ✅ Backfill existing data: `npm run count:backfill`
3. ✅ Query counts in your app (see examples above)
4. ✅ Monitor Cloud Functions logs for errors

---

## 📞 Support

If you encounter issues:

1. Check Cloud Functions logs: `gcloud functions log read`
2. Verify Firestore permissions for the Service Account
3. Re-run backfill if data seems stale
4. Check Firestore quotas and limits in the console

---

**Last Updated**: 22 April 2026
