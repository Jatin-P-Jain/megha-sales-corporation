const admin = require('firebase-admin');
const path = require('node:path');
const fs = require('node:fs');

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getCountTotal(db, key) {
  const snap = await db.collection('count').doc(key).get();
  return Number(snap.data()?.total || 0);
}

async function waitForTotal(db, key, expected, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const current = await getCountTotal(db, key);
    if (current === expected) return { ok: true, total: current };
    await sleep(3000);
  }
  return { ok: false, total: await getCountTotal(db, key) };
}

(async () => {
  const repoRoot = '/Users/JainJatinPrakash/Work/Personal/megha-sales-corporation';
  const serviceAccountPath = path.resolve(repoRoot, 'serviceAccount.prod.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Missing service account at ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const testSuffix = `${Date.now()}`;
  const refs = {
    products: db.collection('products').doc(`count_verify_product_${testSuffix}`),
    orders: db.collection('orders').doc(`count_verify_order_${testSuffix}`),
    users: db.collection('users').doc(`count_verify_user_${testSuffix}`),
  };

  const created = [];

  try {
    const before = {
      products: await getCountTotal(db, 'products'),
      orders: await getCountTotal(db, 'orders'),
      users: await getCountTotal(db, 'users'),
    };

    console.log('Before totals:', before);

    await refs.products.set({
      id: refs.products.id,
      brandId: 'count-verification',
      status: 'for-sale',
      image: '',
      partNumber: 'COUNT-VERIFY-PRODUCT',
      partName: 'Count Verify Product',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    created.push(refs.products);

    const pUp = await waitForTotal(db, 'products', before.products + 1);
    if (!pUp.ok) throw new Error(`products total did not increment to ${before.products + 1}; got ${pUp.total}`);
    console.log(`Products increment verified: ${before.products} -> ${pUp.total}`);

    await refs.orders.set({
      id: refs.orders.id,
      status: 'pending',
      user: { uid: 'count-verification-user' },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    created.push(refs.orders);

    const oUp = await waitForTotal(db, 'orders', before.orders + 1);
    if (!oUp.ok) throw new Error(`orders total did not increment to ${before.orders + 1}; got ${oUp.total}`);
    console.log(`Orders increment verified: ${before.orders} -> ${oUp.total}`);

    await refs.users.set({
      uid: refs.users.id,
      userId: refs.users.id,
      email: null,
      phone: null,
      displayName: 'Count Verification User',
      businessType: 'retailer',
    });
    created.push(refs.users);

    const uUp = await waitForTotal(db, 'users', before.users + 1);
    if (!uUp.ok) throw new Error(`users total did not increment to ${before.users + 1}; got ${uUp.total}`);
    console.log(`Users increment verified: ${before.users} -> ${uUp.total}`);

    for (const key of ['users', 'orders', 'products']) {
      const ref = refs[key];
      const beforeDown = await getCountTotal(db, key);
      await ref.delete();
      const expected = beforeDown - 1;
      const down = await waitForTotal(db, key, expected);
      if (!down.ok) throw new Error(`${key} total did not decrement to ${expected}; got ${down.total}`);
      console.log(`${key} decrement verified: ${beforeDown} -> ${down.total}`);
    }

    const after = {
      products: await getCountTotal(db, 'products'),
      orders: await getCountTotal(db, 'orders'),
      users: await getCountTotal(db, 'users'),
    };

    console.log('After totals:', after);
    console.log('Verification passed: products/orders/users count triggers are working.');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err?.message || err);
    for (const ref of created.reverse()) {
      try { await ref.delete(); } catch {}
    }
    process.exit(1);
  }
})();
