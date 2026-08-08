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
| API routes (orders, reviews, upload, payments) | ⏳ next phase |
| QPay payments via Wire (reseller) | ✅ built — needs `WIRE_*` credentials |
| Email sending | ⏳ stubbed |

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

See [`.env.example`](.env.example) — Firebase web + admin keys, `WIRE_*`
(payments, see below), and `EMAIL_*`.

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
  services/       catalog.ts (data layer), orders.ts, payment.ts (Wire/QPay), reviews…
  lib/            firebase/{client,admin}, payments/wire.ts, format (MNT), utils, validation/
  config/site.ts  store info + navigation (mirrors live menu)
  data/seed.ts    real Lining Club catalog
  types/          domain model
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
scripts/seed.ts
```

## Payments — QPay via Wire (reseller mode)

QPay is reached through **Wire**, not directly. The connection is registered on
Wire as `operator: "qpay", mode: "reseller"`, which means Wire settles under its
own QPay merchant rights — **this app holds no QPay username, password or
invoice code**. The only secret is the Wire API key.

### One-time onboarding (Wire dashboard — not automatable)

1. Wire dashboard → your project → **Суваг** (`/project/connectors`).
2. Pick the **QPay** card (“QR нэхэмжлэх — reseller merchant”).
3. Submit the application form (business details, MCC, address).
4. Wait for Wire's admin to approve it.
5. Sign the QPay contract: read the PDF, accept the terms, sign electronically
   with **ДАН**.
6. The merchant activates and can accept QR payments.
7. Choose the settlement account under **Данс удирдах**.

Then set `WIRE_API_BASE_URL` and `WIRE_API_KEY` in the environment. Admin →
Тохиргоо shows the live connection (`GET /v1/operator_connections`) and a test
button (`POST /v1/operator_connections/{id}/test`).

Also register a webhook endpoint for `payment_intent.succeeded` (Admin →
Тохиргоо prints the URL) and put the returned `whsec_…` in
`WIRE_WEBHOOK_SECRET` — Wire shows that secret only once.

### How a payment flows

Collection uses Wire's **hosted checkout**: Wire renders the QR and the bank
deeplinks on `pay.wire.mn`. There is no API that returns a raw QR, and
`/v1/payment_intents/{id}/confirm` must NOT be called — a confirmed intent can
no longer take a checkout session.

```
checkout (qpay) → POST /api/orders                  order + payment token
               → /checkout/pay/[orderNumber]
               → POST /api/payments/qpay/session    PaymentIntent (qpay only)
                                                    + checkout session
               → redirect to pay.wire.mn            QR + bank deeplinks
buyer pays  ───→ back to /checkout/pay/…?return=1   verify, never trust redirect
               → POST /api/payments/qpay/status     polled until confirmed
Wire  ─────────→ POST /api/payments/wire/webhook    payment_intent.succeeded
               → success page
```

- `src/lib/payments/wire.ts` — Wire HTTP client (connections, intents, sessions).
- `src/services/payment.ts` — order-aware orchestration; reuses a live intent
  instead of minting a second invoice on refresh.
- Neither the webhook nor the return redirect is trusted: both only *trigger* a
  re-read of the intent from Wire's API, which is what actually marks an order
  paid. This is Wire's own documented advice.
- Public payment endpoints are gated by a per-order token issued at checkout
  (order numbers are short and partly time-derived, so they are not a secret).
  The token is kept in `sessionStorage`, never in the URL.

**Amounts are whole tögrög** — `amount: 12345` is billed as 12,345 ₮. Wire's
docs claim minor units ("50000 гэдэг нь 500.00 ₮"), but the live product does
not: an intent created with `amount: 12345` renders as "12,345₮" on
pay.wire.mn and dispatches to QPay at that figure. `toWireAmount()` is the
single place this lives — flip it there if Wire ever confirms the docs.

Every mutating POST needs an `Idempotency-Key`; the client sends a stable key
when creating an invoice (so a retry cannot double-charge) and a fresh one
otherwise.

### Testing without money

Wire has a sandbox: take an `sk_test_…` key from the dashboard and use
`allowed_operators: ["sandbox"]`. No contract needed and no real funds move.
