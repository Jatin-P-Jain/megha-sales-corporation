# Firestore Maintenance Scripts

This folder groups Firestore-related scripts and their outputs.

## Structure

- `scripts/firestore/`
  - `audit-firestore-products.ts`
  - `audit-product-brand-integrity.ts`
  - `fix-product-brand-aepl.ts`
  - `legacy/` (older one-off migration/maintenance scripts)
  - `reports/` (generated audit/report outputs)

## Common Commands

- `npm run audit:products`
- `npm run audit:product-brand-integrity`
- `npm run fix:brand-aepl:dry`
- `npm run fix:brand-aepl`

## Notes

- Scripts expect `serviceAccount.prod.json` at repository root.
- Most scripts support `--output=...` to customize report path.
