# CLAUDE.md

## Project Overview

**MediFlow** (`liganexus-web-app`) is a multi-tenant clinic **stock management** and pharmacy portal for homeopathy clinics. Core: Firestore-backed stock & inventory (batches, expiry, immutable movement ledger), medicine vault, patients, billing, role-based access. Deployed on Vercel with Firebase Auth + Firestore.

- **Framework**: Next.js 15.4.8 (App Router)
- **UI & Styling**: React 19.1.2, Tailwind CSS 3.3.3, shadcn/ui (Radix primitives), Recharts 2.15.4, (ECharts is not installed)
- **State Management**: Redux Toolkit 2.8.2 (`auth`, `ui`, `patients`, `stock` slices)
- **Form Handling & Validation**: React Hook Form 7.62 + Zod 4.0.17
- **Backend & Database**: Firebase Auth + Cloud Firestore (Client SDK & Firebase Admin SDK 14.1.0)

---

## Developer Commands & Setup

> **Note on Windows PowerShell**: Executing `npm` or `pnpm` directly may trigger PowerShell execution policy errors (`npm.ps1 cannot be loaded`). Always invoke `npm.cmd`, `npx.cmd`, or `pnpm.cmd`, or run `Set-ExecutionPolicy -Scope Process Bypass`.

### Installation
```bash
# npm is the single package manager (package-lock.json). pnpm lockfile was removed.
npm ci        # or: npm.cmd ci on Windows PowerShell (no --legacy-peer-deps needed)
```

### Development, build, quality gates
```bash
npm run dev                      # http://localhost:3000 (falls back to 3001 if busy)
npm run typecheck                # tsc --noEmit, must be 0 errors
npm run lint                     # ESLint, 0 errors required (build fails on errors)
npm test                         # Vitest unit tests (stock logic, permissions, API layer, helpers)
npm run test:rules               # 160 Firestore security-rule tests in the emulator (needs Java)
npm run build                    # production build; needs NO secrets; type/lint errors fail it
npm run verify                   # typecheck (app + tests) + lint + unit + rules tests + build
```
**Never build into the same folder a `next dev` is using**: they share `.next`, the dev server's assets start returning 400 and the build can fail with "Failed to collect page data". Build and serve production into its own folder instead: `NEXT_DIST_DIR=.next-prod npm run build` then `NEXT_DIST_DIR=.next-prod npx next start -p 4001` (PowerShell: `$env:NEXT_DIST_DIR='.next-prod'`). Vercel uses the default `.next`.

### End-to-end tests (Playwright, TEST Firebase project only)
```bash
npx playwright install chromium
npm run build && PLAYWRIGHT_START_SERVER=1 E2E_PROD=1 npx playwright test   # 46 tests: public, 12 pages x desktop/mobile, stock journey
PLAYWRIGHT_BASE_URL=https://<domain> E2E_PROD=1 npx playwright test --project=public   # live smoke test, no credentials
```
`tests/e2e/auth.setup.ts` signs in with `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` (.env.local) and saves `storageState` **with IndexedDB** (Firebase client auth lives there; without it protected pages render blank). The login card has a hidden duplicate form: use `input:visible`.

### Other scripts
```bash
npx tsx scripts/verify-patient-roll-number.ts
npx tsx scripts/verify-registration-payload.ts
npx tsx --env-file=.env.local scripts/migrate-flag-categories-to-global.ts [--apply]
```

---

## Environment Configuration

Copy `.env.example` to `.env.local` before running:

```env
NODE_ENV=development

# Firebase Client SDK (Client-side & Next.js App)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Server API routes only — keep private)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional
NEXT_PUBLIC_ALLOW_REGISTRATION=true   # set to false after the owner account exists (hides/blocks /register)
TEST_USER_EMAIL= / TEST_USER_PASSWORD=   # Playwright, TEST project only
```
`.env.local` currently points at the Firebase **test** project `mediflow-test-11bbe`. Never run tests against `mediflow-prod`. Deployment steps: `docs/DEPLOYMENT.md`.

---

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
├──────────────────────────┬─────────────────────────────┤
│   Public / Auth Routes   │    Protected App Routes     │
│   /                      │    /dashboard               │
│   /register              │    /patients, /patients/new │
│                          │    /vault/medicine          │
│                          │    /vault/diseases          │
│                          │    /vault/flag-config       │
│                          │    /inventory               │
│                          │    /billing, /settings      │
└────────────┬─────────────┴──────────────┬──────────────┘
             │                            │
             │ Checked by middleware.ts   │ Role permission checked
             │ Cookie: __session          │ in NavigationsLayout
             ▼                            ▼
┌────────────────────────────────────────────────────────┐
│                   Data Access Layer                    │
├──────────────────────────┬─────────────────────────────┤
│   Direct Client SDK      │     REST API Route Proxy    │
│   (services/pharmacy-api)│     (services/*-api.ts)     │
│   - Billing & Payments   │     - GET /api/v1/patients  │
│   - Settings & Tenants   │     - GET /api/v1/medicines │
│   - Staff Directory      │     - /api/v1/diseases      │
│   - Dashboard Stats      │     - /api/v1/flags         │
├──────────────────────────┼─────────────────────────────┤
│   Stock (Firestore, txn) │     Firebase Admin SDK      │
│   (services/stock-api)   │     (/api/auth/session,     │
│   - stockItems + batches │      /api/admin/users)      │
│   - stockMovements (log) │     - Session verification  │
└────────────┬─────────────┴──────────────┬──────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────────────────────────────────────┐
│                   Cloud Firestore                      │
│   businesses/{businessId}/patients                     │
│   businesses/{businessId}/medicines                    │
│   businesses/{businessId}/diseases                     │
│   flagCategories/{categoryId}/flags/{flagId} (global)  │
│   businesses/{businessId}/stockItems, stockMovements   │
│   users/{uid} (admin / staff profiles)                 │
└────────────────────────────────────────────────────────┘
```

### Multi-Tenancy & Firestore Hierarchy
- Every tenant clinic is keyed by `businessId` (which defaults to the `super_admin`'s Firebase Auth `uid`).
- **Scoped collections**:
  - `businesses/{businessId}/patients`: Patient profile, consultation details, and visits.
  - `businesses/{businessId}/medicines`: Medicine registry (verified in `firestore-rest.ts` and `getDashboardStats`; older notes said `classes`).
  - `businesses/{businessId}/diseases`: Clinical conditions and symptom catalogs.
  - `businesses/{businessId}/payments`: Patient financial transactions.
  - `businesses/{businessId}/feeStructures`: Billing configuration and fees.
  - `businesses/{businessId}/stockItems/{medicineId__potency}`: one SKU per medicine+potency, batches embedded (`batches[]`), totals kept consistent by Firestore transactions.
  - `businesses/{businessId}/stockMovements/{id}`: append-only ledger (purchase/dispense/adjustment/return/expired) with `performedById` = real uid; rules forbid update/delete.
- **Global collections**:
  - `users/{uid}`: Global user directory with roles and tenant assignments.
  - `flagCategories/{categoryId}/flags/{flagId}`: Global taxonomy for medicines (potencies, forms, symptom categories, etc.).

### Authentication & Authorization Flow
1. **Client Auth**: Handled by Firebase Client Auth (`signInWithEmailAndPassword` / `createUserWithEmailAndPassword`).
2. **Session Cookie**: Client sends `idToken` to `/api/auth/session`, which mints a Firebase Admin session cookie named `__session` (valid 14 days) with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
3. **Route Guarding**:
   - `src/middleware.ts` validates the presence of `__session`. Unauthenticated requests redirect to `/` with `?redirect=...`.
   - `src/app/(Navigations)/layout.tsx` verifies that the user is active and has granular view permissions via `canAccessPath`.
4. **Firestore rules** (`firestore.rules`, 119 tests in `tests/rules/`): default deny; tenant from `users/{uid}.businessId`; **browsers can never create `users` or `businesses` docs** (owners are created by `POST /api/auth/register`, staff by `POST /api/admin/users`, both Admin SDK; disabling goes through `PATCH /api/admin/users/[id]` which also disables the Firebase Auth account and revokes tokens); staff cannot write medicines/diseases/fees/flags, cannot delete patients/prescriptions/stock items, can create but not edit payments; activities and stock movements are append-only; stock items deletable only at quantity 0 and only by admins. Deploy: `firebase deploy --only firestore:rules,firestore:indexes` (test project can also be updated with the Admin SDK `securityRules()` API).
   API routes: `requireApiIdToken(request, { resource, action })` returns 403 for insufficient role. `normalizeUserRole` fails closed (unknown role = staff).
5. **Roles**:
   - `super_admin`: Full access to all resources and management settings.
   - `staff`: Read/write access to patients, inventory, prescriptions, and billing; read-only to medicines; no access to settings.

---

## Important File Paths & Directory Map

| Path | Purpose |
|---|---|
| `src/app/(auth)/` | Public authentication routes (`/` login, `/register`) |
| `src/app/(Navigations)/` | Protected application layout and navigation sections |
| `src/app/(Navigations)/dashboard/page.tsx` | Bento-grid analytics dashboard |
| `src/app/(Navigations)/patients/` | Patient directory, registration (`/new`), and profile view (`/[id]`) |
| `src/app/(Navigations)/vault/` | Clinical vault: medicines (`/medicine`), diseases (`/diseases`), and flags (`/flag-configurations`) |
| `src/app/(Navigations)/inventory/page.tsx` | Medicine stock levels, batch inventory, and movements |
| `src/app/(Navigations)/prescriptions/page.tsx` | Prescription & evaluation management, marks recording, and results panel |
| `src/app/(Navigations)/billing/page.tsx` | Fee collections, patient balance tracking, payment modal |
| `src/app/(Navigations)/settings/page.tsx` | Clinic profile, fiscal configuration, user management |
| `src/app/api/auth/session/route.ts` | Sets `__session` HTTP-only cookie via Firebase Admin |
| `src/app/api/auth/logout/route.ts` | Clears `__session` cookie and revokes session |
| `src/app/api/v1/` | Next.js API endpoints for patients, medicines list, diseases, and flags |
| `src/components/layout/admin-sidebar.tsx` | Primary responsive sidebar with navigation sections and collapsible state |
| `src/components/patients/patient-registration-form.tsx` | Multi-step/accordion patient registration form with prescription row |
| `src/components/medicines/medicine-vault-form.tsx` | Clinical medicine creation and edit form |
| `src/lib/firebase/app.ts` | Firebase Client SDK initialization (`auth`, `db`) |
| `src/lib/firebase/admin.ts` | Firebase Admin SDK initialization (`adminAuth`, `adminDb`) |
| `src/lib/permissions.ts` | RBAC role definitions and route access control maps |
| `src/lib/routes.ts` | Single source of truth for application route constants (`ROUTES`) |
| `src/lib/patients/patient-roll-number.ts` | Generates monthly sequence roll numbers (`YYYYMM###`) |
| `src/lib/patient-registration-schema.ts` | Zod schema & default values for patient registration form |
| `src/redux/store.ts` | Redux store combining `auth`, `ui`, `patients`, and `stock` reducers |
| `src/services/pharmacy-api.ts` | Primary client-side Firestore service layer |
| `src/services/stock-api.ts` | Stock service on Firestore (transactions: create/update/delete item, receive, adjust with FEFO, ledger) |
| `src/components/inventory/` | Stock UI: ledger table/cards, add/edit item, receive, adjust, alerts, movements, CSV export |
| `src/components/layout/stock-alerts-bell.tsx` | Header bell with low-stock / expiry alerts |
| `src/lib/stock-utils.ts`, `stock-stats.ts`, `stock-export.ts` | Sellable vs expired quantity, alerts, stats, CSV rows |
| `firestore.rules`, `firestore.indexes.json`, `firebase.json` | Security rules, indexes, emulator config |
| `vercel.json`, `next.config.ts` | Vercel settings; security headers + CSP; build checks ON |
| `.github/workflows/ci.yml` | CI: typecheck, lint, rules tests, scripts, build |
| `docs/DEPLOYMENT.md`, `docs/IMPROVEMENT-PLAN.md` | Deployment guide; audit history and roadmap |
| `Rules/rules.md` | Core engineering & UI guidelines for the project |

---

## Coding Standards & Design Guidelines

*(Mandated by `Rules/rules.md`)*

1. **Bento Grid & Glassmorphism**:
   - Layouts must follow a compact Bento Grid structure (`BentoGrid`, `BentoCard` from `@/components/shared`).
   - Seamless support for both light and dark modes (`next-themes`).
   - Use distinct accent colors per metric (defined in `tailwind.config.js` via `--metric-*` variables).
2. **Performance**: Keep client components lightweight; lazily import heavy modals or charts using `next/dynamic`.
3. **Type Safety**: Run `npx tsc --noEmit` before concluding work; ensure all TypeScript errors are resolved.
4. **Component Reuse**: Check existing components in `@/components` and `@/components/ui` before creating new ones.
5. **Barrel Exports**: Whenever a new component, hook, type, or service is added, export it from its corresponding `index.ts` file.

---

## Known Issues, Gaps & Technical Debt

- **/prescriptions** (school-exam logic) was retired: removed from the sidebar, the page and its components deleted, `/prescriptions` redirects to `/patients`. Prescriptions live on each patient. A real prescription register is still a possible feature.
- **Flag taxonomy** is per clinic (`businesses/{b}/flagCategories`), seeded on first use from the read-only global template `flagCategories` (only the Admin SDK / migration script can change the template).
- **Billing** has no UI for fee structures/categories or due dates, so Due is always 0 until data is seeded.
- **Client-SDK writes**: billing/settings/medicine writes go straight from the browser; Firestore rules are the guard. API routes (`/api/v1/*`) check roles server-side.
- **Middleware** only checks that the `__session` cookie exists; real verification happens in API routes and the protected layout.
- Remaining lint **warnings** (unused vars, a few `<img>`); errors are 0.
- Legacy school remnants in `labels.ts` (`staff`, medicine keys) and `pharmacy-api.ts` (attendance/inventory functions) are dead code to delete.
- Stock movements load the latest 300 only (the UI says so); older ones stay in Firestore.
- `test:rules` uses `scripts/test-rules.mjs` (Firestore emulator on port 8085) which also kills a leftover emulator process on Windows.

---

## Loading & motion rules (2026-10-22)

- **Static content paints at once; only API data shows a skeleton.** Titles, hero text/buttons, tab and field labels, filter bars and table headers must never wait for a request. Data-backed bits (stat values, table rows, chart, option lists, field values on detail pages) use skeleton blocks (`animate-pulse rounded-md bg-muted`, sized like the final content, `aria-busy`). Empty/404 states appear only after data loaded. Never early-return a whole-page skeleton. Reusable pieces: `PageSkeleton`, `dashboard/skeleton-bits.tsx`, `medicines/skeleton-bits.tsx`, `patients/skeleton-bits.tsx`, `inventory-skeleton.tsx` (`PendingStat`), `billing/stat-card-content.tsx`. Give controls whose label is a skeleton an `aria-label`.
- **No loaders or motion**: no spinners, full-screen loader, count-up numbers, entrance or looping animations. `globals.css` ends with a policy that sets `animation: none` for everything except skeletons and hides `.animate-spin`. Do not add spinner icons; use text ("Saving...") on busy buttons.
- `ThemeProvider` must not gate rendering (it used to hide the whole app until hydration and remount every child).
- The app shell (sidebar) always paints first; the sidebar uses the cached role. There is **no top header**: the account tile at the bottom of the sidebar (`src/components/layout/profile-menu.tsx`, modelled on the LigaX app) opens the account menu (identity, notifications = stock alerts badge, clinic settings for admins, dark-mode switch, sign out with confirm). On mobile a floating menu button opens the sidebar sheet. This project's Tailwind is 3.3: do not use `size-*` utilities, use `h-* w-*`.

## Performance notes (2026-10-22)

- Startup: `initAuth` renders the app from the cached profile when the session flag cookie `mf_session` exists and verifies with Firebase in the background (`sessionConfirmed` / `sessionInvalidated` in `authSlice`; `(auth)/layout` redirects only once `sessionVerified`). Shell appears in ~0.4 s instead of ~2.7 s.
- API helpers use `getFirebaseIdToken()` (`src/lib/firebase/id-token.ts`), which awaits `auth.authStateReady()`; never read `auth.currentUser` directly at page load.
- Client Firestore uses **`firebase/firestore/lite`** (no realtime listeners are used; `onSnapshot` is not available). Import it from `firebase/firestore/lite`, not `firebase/firestore`.
- Do not import from the `@/components` or `@/hooks` barrels in layouts and shared components; import the module directly (the barrels pulled ECharts/Recharts into every page). Login first-load JS: 752 kB to 274 kB.
- `/api/v1` token check: signature verified locally, disabled/revoked check runs in parallel with the profile read.
- Per-page data still waits ~1 s for Firebase Auth's own account lookup. Keep the Vercel function region next to the Firestore region.

## Audit & Delivery Log (2026-10-16)

Full findings and roadmap: `docs/IMPROVEMENT-PLAN.md`. Deployment: `docs/DEPLOYMENT.md`.

- Stock module moved from `localStorage` to Firestore (transactions, FEFO, immutable ledger, expiry-aware sellable stock, add/edit/delete item, count corrections, CSV export, header alerts bell).
- Firestore rules + 108 emulator tests; API role enforcement; fail-closed roles; patient class-counter writes removed (they violated the rules for staff); `updateAdminUser` only writes `name`/`isActive`.
- Build hardening: lint/type errors fail the build; security headers + CSP (Firebase Auth needs `https://apis.google.com` in `script-src`); lazy Admin SDK init; npm-only lockfile; dead nutrition/chatbot/legacy files deleted.
- Auth: real Forgot-password email; `NEXT_PUBLIC_ALLOW_REGISTRATION` switch; stale-cookie redirect loop fixed; `?redirect=` honoured.
- Verified on a production build: `npm run verify` exit 0; Playwright 46/46 (public + 12 pages x desktop/mobile + stock journey), 0 console errors.
- Connectivity audit (this session): static trace of every page/CRUD path plus live tests under the strict rules: owner CRUD for patients, vault, flags, stock, billing, settings, dashboard; staff, disabled-user and cross-tenant isolation checks. Fixed: patient profile read of non-existent school collections (view/edit 500), self-service owner creation, API role gaps, disable-user not disabling Auth, false failures when the activity feed write failed, dashboard staff count, overpayment, flag value stability.
- Not done by the assistant (needs the account owner): signing in to Firebase/Vercel (shariquecode@gmail.com) and running the deploy commands in `docs/DEPLOYMENT.md`.

## Hardening log (2026-10-23)

Full audit: `docs/NEXTJS-CODE-REVIEW.md`; plan and status: `docs/FIX-PLAN.md`.

- **Firestore cost**: lists read one bounded page + a server-side count (`fetchFirestoreCollectionPage`, `countFirestoreDocuments` in `firestore-rest.ts`); filtered/search requests still scan. Dashboard uses count queries and this month's payments only. Stock loads once per minute (`loadStockData` has a freshness `condition`, `{ force: true }` to refresh). Flags, medicines list and billing sums are cached/grouped. Patient roll numbers come from one indexed read (`queryLastWithPrefix`), not a full list.
- **API layer** (`src/lib/api/`): `api-error.ts` (`DomainError`, `errorResponse`, `parseJsonBody`), `api-auth-error.ts`, `path-segment.ts` (`safeSegment` for route params), `same-origin.ts`, `rate-limit.ts` (Firestore-backed counters in `rateLimits/*`, Admin SDK only; enable a TTL policy on `expiresAt` to auto-clean). Zod schemas for bodies live in `src/lib/schemas/api-schemas.ts`. Patient updates are whitelisted (`sanitizePatientUpdate`); the patient ID is immutable. Patient list responses carry list columns only (no Aadhaar, parents, notes).
- **Registration** is closed unless `ALLOW_REGISTRATION=true` (server, read at request time) or the legacy `NEXT_PUBLIC_ALLOW_REGISTRATION=true`; see `src/lib/registration.ts`.
- **CSP** is built per request in `middleware.ts` (`src/lib/csp.ts`): nonce + `strict-dynamic`, so the root layout is `force-dynamic` and passes the nonce to next-themes. Do not add a route-level `loading.tsx` under `(Navigations)`: its Suspense boundary delays hydration of the page until after `initAuth` has changed Redux state and causes hydration mismatches (#418).
- **Rules** validate patients, payments (amount range, patient must exist) and tie every stock quantity change to a ledger entry written in the same transaction (`lastMovementId`). Legacy `inventory`, `staff`, `classes` collections are denied.
- **Accessibility**: axe (WCAG 2.1 A/AA, serious+critical) runs in `tests/e2e/a11y.spec.ts`; brand-coloured buttons use darker shades for white text and text accents use `--metric-*-text` tokens. Comboboxes need an `aria-label` (they are not named by content).
- **Cleanup**: unused UI wrappers, test routes, mock notifications, legacy service functions, orphan packages and about half of `globals.css` were removed; pages were verified pixel-identical (24 screenshots, light/dark).
- **Install** no longer needs `--legacy-peer-deps` (override for `@firebase/rules-unit-testing`).

## Control standard (modelled on the LigaX organisation screens)

- **Buttons** (`ui/button.tsx` + the `UI standard` block at the end of `globals.css`): 36px default (32px `sm`), 8px radius, 14px/500, 6px icon gap, flat (no glow, no lift on hover), 150 ms transitions on colour/border/shadow only, one 2px focus ring.
- **Inputs, textareas, select triggers**: share the `ui-field` class: 8px radius, `muted/30` fill, 1px border, faint inset top highlight, blue focus border + 2px ring, hover `muted/50`.
- **Dropdowns** (select, dropdown menu, popover, command list): `rounded-xl` panel with border and soft large shadow, 4px padding, 32px items at 13px/500 with 8px radius, hover `muted`, selected item in brand colour with a check on the right.
- **Tabs**: muted track (`rounded-xl`, 4px padding) with 28px triggers; active trigger is raised on the page background.
- **Tables**: 11px/700 uppercase headers on a muted band, 14px cells, hairline row borders, 12px shell radius.
- Tailwind 3.3 has no `min-h-10`; use `min-h-[2.5rem]`.

## Page headers & cards
- **Every page header, including inner pages (new / detail / edit), is `PageHero`** (`src/components/shared/page-hero.tsx`): two lines (icon + h1 + badge, then muted subtitle), actions on the right (`heroButtonClass` / `heroPrimaryClass`). Inner pages pass `back={{ href, label }}` for a round back button. Place it in a `<div className="col-span-full">`, never inside a BentoCard. Each page renders exactly one `<h1>` in every state (loading, loaded, edit, not-found).
- **Every card header is one of two components, both with the same accent icon tile:** `CardHeader` (`src/components/shared/card-header.tsx`, form-style, optional ornament line) or `SectionCardHeader` (table/panel cards, bottom border). Pass `accent`: patients, staff, medicines, fees, inventory, prescriptions (all defined in `globals.css` under `.clinic-form-section-header[data-accent]`; a new accent needs a rule there or the tile loses its colour). `PatientFormSectionHeader` is a thin wrapper kept for old call sites.
- Stat tiles are one compact row (`metric-stat metric-stat-compact`: 36px icon tile, title over value). BentoCard padding is `p-4`. Do not wrap a form in an invisible BentoCard (the inner glass panel still draws); use a plain `div`.
- Cards have no hover effect; only table rows and buttons keep hover states.
- **Radius scale** (`tailwind.config.js`): `rounded-2xl` = 12px for cards, panels and tables; `xl` 10px, `lg` 8px for controls. Do not use arbitrary `rounded-[20px]`-style values. Patient detail opens with a summary strip (ID, phone, last visit, visits, fees); section headers use a plain hairline, not an ornament.
