# Megha Sales Corporation

Production Next.js application for product discovery, ordering, account management, admin workflows, and Firebase-backed notifications.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Firebase (Auth, Firestore, Storage, Messaging)
- ESLint

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

App runs on `http://localhost:3000`.

## Environment Behavior

The service worker file in `public/firebase-messaging-sw.js` is generated during `dev` and `build` by `scripts/generate-sw.ts`.

Environment selection order for service worker generation:

1. `APP_ENV`
2. `NODE_ENV`
3. lifecycle fallback (`prebuild` => `production`, otherwise `development`)

Current npm scripts set `APP_ENV` explicitly:

- `npm run dev` => `APP_ENV=development`
- `npm run build` (via `prebuild`) => `APP_ENV=production`

This means you do not need to manually define `APP_ENV` in env files or on Vercel unless you want to override behavior.

## Quality Gates

Run checks locally:

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## CI Workflow

CI is defined in [.github/workflows/ci.yml](.github/workflows/ci.yml).

When CI runs:

- On every pull request
- On pushes to `main`

What CI does in order:

1. Checks out repository code
2. Sets up Node.js 20 with npm cache
3. Installs dependencies with `npm ci`
4. Runs lint (`npm run lint`)
5. Runs production build (`npm run build`)
6. Runs security gate (`npm audit --omit=dev --audit-level=high`)

Pass/fail behavior:

- If any step fails, the workflow fails and the PR/push is marked failed.
- Only low-severity audit findings are currently tolerated by this gate.

## Release Checklist

Before release:

1. Ensure CI is green.
2. Verify required production env vars are set on deployment platform.
3. Confirm `npm run build` succeeds locally for the release branch.
4. Smoke-test critical flows:
	- login
	- products list/filter
	- checkout
	- admin dashboard access
	- notifications
5. Deploy and monitor logs for auth, API, and notification errors.
