# Lining Club — custom storefront

A fully custom, self-owned e-commerce app that replaces the Lining Club Shopify
store (sneakers / гутал, Ulaanbaatar). Built to avoid Shopify collaborator fees
and give admin/staff full control.

- **Next.js 16 (App Router)** · TypeScript (strict) · Tailwind v4 · shadcn-style UI
- **Firebase**: Firestore (data), Storage (images), Auth (admin/staff only)
- **State**: Zustand (persisted cart) · **Forms**: React Hook Form + Zod
- Guest checkout only — customers never authenticate
- Payments: QPay-ready architecture (stubbed) · Email: provider abstraction

## Status

| Area | State |
| --- | --- |
| Storefront (home, listing, filters, search, PDP, cart, checkout, tracking, static pages) | ✅ built & verified, runs on seeded real catalog |
| Mongolian UI, MNT pricing, responsive mobile | ✅ |
| Firebase config, security rules, storage rules, indexes, seed script | ✅ |
| Firestore-backed catalog/orders/reviews (swap from seed) | ⏳ next phase |
| Admin/staff dashboard + RBAC auth | ⏳ next phase |
| API routes (orders, reviews, upload, QPay callback) | ⏳ next phase |
| QPay integration + email sending | ⏳ stubbed, credentials pending |

The catalog currently renders from `src/data/seed.ts` (real titles, prices,
sizes and Shopify CDN images). `src/services/catalog.ts` is the single data
layer — its function bodies swap to Firestore without touching any caller.

## Getting started

```bash
npm install          # if your npm cache is root-owned: npm install --cache /tmp/npm-cache
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

The storefront runs with **no** Firebase credentials (seed data). Firebase is
only needed for the admin panel, orders, reviews and image uploads.

## Firebase setup

1. Create a project at <https://console.firebase.google.com>. Enable
   **Firestore**, **Storage**, and **Authentication → Email/Password**.
2. Web app config → fill the `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local`.
3. Service account (Project settings → Service accounts → Generate key) → fill
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   (keep the `\n` escapes).
4. Deploy rules + indexes:
   ```bash
   npm i -g firebase-tools && firebase login
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. Seed the catalog:
   ```bash
   npm run seed
   ```
6. Create the first admin (after the admin auth phase lands): create an
   Email/Password user, then set a custom claim `{ role: "admin" }` and a doc in
   `admins/{uid}`.

### RBAC model

Role is stored as a Firebase Auth **custom claim** and mirrored in `admins/{uid}`.

- **admin** — full CRUD: products, categories, content, orders, staff, settings, uploads, deletes.
- **staff** — products, accept/update orders, edit content. **Cannot** manage admins, change settings, or delete critical config.

Enforced in three layers: `middleware.ts` (route guard), server actions/API
(`firebase-admin` token verification), and `firestore.rules` / `storage.rules`.

## Environment variables

See [`.env.example`](.env.example) — Firebase web + admin keys, `QPAY_*`
(TODO: fill at merchant onboarding), and `EMAIL_*`.

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add every var from `.env.example` in Project → Settings → Environment Variables.
   Paste `FIREBASE_PRIVATE_KEY` exactly (with `\n`).
3. Deploy. Rules/indexes are deployed separately via `firebase deploy`.

## Project structure

```
src/
  app/            (store) routes, checkout, track, pages, not-found; admin + api (next phase)
  components/     ui/ (shadcn-style), layout/, product/, cart/, home/, reviews/
  features/cart/  Zustand store (persisted)
  services/       catalog.ts (data layer) — orders/reviews/payment/email next phase
  lib/            firebase/{client,admin}, format (MNT), utils, validation/, order-number
  config/site.ts  store info + navigation (mirrors live menu)
  data/seed.ts    real Lining Club catalog
  types/          domain model
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
scripts/seed.ts
```

## Payments (QPay) — architecture only

A `PaymentProvider` interface with a `QPayProvider` (`createInvoice` /
`checkStatus`) will live in `src/services/payment/`. Credentials go in `QPAY_*`.
Checkout currently simulates a guest order client-side (see the `TODO(backend)`
markers in `src/app/checkout/page.tsx`).
