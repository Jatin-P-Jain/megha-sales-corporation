# ✅ Count Collection Setup Checklist

## Completed Tasks

- [x] **Cloud Functions Created**
  - [x] `updateProductsCount` (products collection trigger)
  - [x] `updateUsersCount` (users collection trigger)
  - [x] `updateOrdersCount` (orders collection trigger)
  - [x] `updateEnquiriesCount` (enquiries collection trigger)
  - [x] `updateBrandsCount` (brands collection trigger)
  - File: `functions/src/count-aggregator.ts`

- [x] **Exports Added**
  - [x] All 5 functions exported from `functions/src/index.ts`
  - [x] No TypeScript errors

- [x] **Backfill Script Created & Executed**
  - [x] Script: `scripts/firestore/backfill-count-collection.ts`
  - [x] Backfill executed: `npm run count:backfill` ✅
  - [x] Results:
    - Products: 2,240 total, 136 without image
    - Users: 3 total, 0 approved, 0 active
    - Orders: 2 total
    - Enquiries: 0 total
    - Brands: 11 total

- [x] **npm Scripts Added**
  - [x] `"count:backfill"` — Run backfill script
  - [x] `"count:deploy"` — Deploy functions to Firebase
  - Updated: `package.json`

- [x] **Documentation Created**
  - [x] `docs/COUNT_COLLECTION_AGGREGATOR.md` (280 lines)
    - Complete setup guide
    - API reference
    - Troubleshooting
  - [x] `docs/COUNT_COLLECTION_EXAMPLES.ts` (320 lines)
    - 10 real-world code examples
    - React hooks
    - Server components
    - Real-time listeners
  - [x] `SETUP_COMPLETE_COUNT_COLLECTION.md` (180 lines)
    - Quick reference
    - Next steps
    - Cost implications

- [x] **Repository Memory Created**
  - [x] `/memories/repo/count-collection-aggregator.md`

---

## Pending Tasks (Action Required)

### 1. Deploy Cloud Functions
```bash
npm run count:deploy
```

**What it does:**
- Uploads the 5 new Cloud Functions to Firebase
- Functions will automatically trigger on writes to products, users, orders, enquiries, brands
- Backfill data is retained and updated in real-time

**Estimated time:** 2-3 minutes

**Verification:**
```bash
gcloud functions list  # Verify functions deployed
firebase deploy --only functions:updateProductsCount  # Check specific function
```

---

## After Deployment

### Query Counts in Your App

**Frontend (React/Next.js):**
```typescript
import { doc, getDoc, collection } from "firebase/firestore";
import { firestore } from "@/firebase/client";

const countRef = doc(collection(firestore, "count"), "products");
const snap = await getDoc(countRef);
const { total, noImage, byBrand } = snap.data();
```

**Backend (Server Actions/API):**
```typescript
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const snap = await db.collection("count").doc("users").get();
const { total, approved, active } = snap.data();
```

### Real-Time Updates (Listeners)
```typescript
import { onSnapshot, doc, collection } from "firebase/firestore";

onSnapshot(doc(collection(firestore, "count"), "products"), (snap) => {
  const counts = snap.data();
  console.log(`Products updated: ${counts.total}`);
});
```

---

## Data Structure

### Products (`count/products`)
```json
{
  "total": 2240,
  "noImage": 136,
  "byBrand": {
    "autokoi": 150,
    "accurub": 120,
    ...
  },
  "byStatus": {
    "for-sale": 2100,
    "discontinued": 80,
    ...
  },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

### Users (`count/users`)
```json
{
  "total": 3,
  "approved": 0,
  "active": 0,
  "byBusinessType": { ... },
  "byAccountStatus": { ... },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

### Orders (`count/orders`)
```json
{
  "total": 2,
  "byStatus": { ... },
  "byUserId": { ... },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

### Enquiries (`count/enquiries`)
```json
{
  "total": 0,
  "byStatus": { ... },
  "byPriority": { ... },
  "byUserId": { ... },
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

### Brands (`count/brands`)
```json
{
  "total": 11,
  "updatedAt": "2026-04-22T15:30:00.000Z"
}
```

---

## Monitoring

### Check if Functions are Running
```bash
gcloud functions log read updateProductsCount --limit 10
gcloud functions log read updateUsersCount --limit 10
```

### Verify Count Accuracy
```bash
npm run count:backfill  # Recalculate from scratch if needed
```

### Monitor Firestore Costs
Each write to a tracked collection triggers:
- 1 read (entire collection)
- 1 write (count document)

For 100 writes/day: ~200 Firestore operations/day

---

## Customization

### Add More Aggregations

Edit `functions/src/count-aggregator.ts` and add new fields:

```typescript
// Example: Count products by company
const byCompany: Record<string, number> = {};
for (const doc of snapshot.docs) {
  const data = doc.data();
  if (data.companyName) {
    byCompany[data.companyName] = (byCompany[data.companyName] || 0) + 1;
  }
}
// Add to countData
```

Then redeploy:
```bash
npm run count:deploy
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Functions won't deploy | Check `functions/.env` and `functions/.env.prod` |
| Counts not updating after writes | Wait 1-2 seconds, check Cloud Functions logs |
| Counts seem stale | Run `npm run count:backfill` to recalculate |
| Firestore quota exceeded | Reduce tracking frequency or add sampling logic |
| Need to modify aggregations | Edit `count-aggregator.ts`, test locally, then deploy |

---

## Success Criteria

✅ **All Green?**

- [ ] Cloud Functions deployed without errors
- [ ] `count/products` exists with correct total (2240)
- [ ] `count/users` exists with correct total (3)
- [ ] `count/orders` exists with correct total (2)
- [ ] `count/brands` exists with correct total (11)
- [ ] Creating a new product updates `count/products` within 2 seconds
- [ ] Dashboard can query `count/*` documents and display metrics

---

## Support

If you encounter issues:

1. Check Cloud Functions logs:
   ```bash
   gcloud functions log read updateProductsCount --limit 50
   ```

2. Verify service account permissions:
   - Firestore read/write permissions
   - Cloud Functions execution permissions

3. Re-run backfill:
   ```bash
   npm run count:backfill
   ```

4. Check documentation:
   - `docs/COUNT_COLLECTION_AGGREGATOR.md`
   - `docs/COUNT_COLLECTION_EXAMPLES.ts`

---

## Timeline

| Task | Status | Date |
|------|--------|------|
| Design aggregation schema | ✅ | 2026-04-22 |
| Create Cloud Functions | ✅ | 2026-04-22 |
| Create backfill script | ✅ | 2026-04-22 |
| Run backfill | ✅ | 2026-04-22 |
| Write documentation | ✅ | 2026-04-22 |
| Deploy Cloud Functions | ⏳ | Pending |
| Query in app | ⏳ | After deploy |
| Monitor & optimize | ⏳ | Post-deploy |

---

## 🎯 Next Action

```bash
npm run count:deploy
```

Your automated count collection system will be live!

---

**Last Updated:** 22 April 2026  
**Status:** ✅ Ready for Deployment
