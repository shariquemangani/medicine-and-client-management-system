# MediFlow — Full Audit, Gap Analysis & Improvement Plan

Audit date: 2026-10-16. Test project: Firebase `mediflow-test-11bbe` (never production).
Method: static read of config, routes, middleware and API routes; four parallel agents drove Chromium (Playwright) through every route on the dev server (desktop 1440, mobile 375, light and dark); then a production build (`next build` + `next start`) was re-tested end to end.

Legend: **[FIXED]** done and verified, **[PARTIAL]** improved but not complete, **[OPEN]** not done, **[DECISION]** needs an owner call.

---

## 1. What was tested

| Area | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (after every change) |
| `next build` | Succeeds. Previously failed without Firebase Admin env; fixed (lazy Admin init) |
| Routes covered | `/`, `/register`, `/dashboard`, `/patients`, `/patients/new`, `/patients/[id]`, `/vault/medicine` (+`/new`, `/[id]`), `/vault/diseases` (+`/new`, `/[id]`), `/vault/flag-configurations`, `/inventory`, `/prescriptions`, `/billing`, `/settings`, 404, redirects |
| Production pass (12 authenticated routes × desktop-light, desktop-dark, mobile-light) | 36/36 loaded, 0 console errors, 0 failed requests, 0 horizontal overflow, 0 raw label keys |
| Production content-ready time (auth init + first page paint with data) | 1.7 – 2.9 s per route on this machine (dashboard slowest at ~2.9 s) |
| Targeted functional test of the fixes | 14/15 passed; the one miss (tab text) was fixed afterwards |

Not covered / limits:
- The payment-validation path was **not exercised in the browser**: the test data has no account with a balance, and the Pay button is disabled at zero balance. The check is in code only.
- `/patients/[id]` History tab and the "New visit" button, flag-category rename/delete (no UI exists), pagination beyond one page, and the staff role (no staff test user) were not exercised.
- Dev-mode timings measured by the agents were inflated by CPU contention (several browsers sharing one dev server) and are not reliable. Use the production numbers above.
- Firestore security rules are not in the repo, so they could not be reviewed.

---

## 2. Findings and status

### 2.1 Security and correctness (highest priority)

| # | Finding | Status |
|---|---|---|
| S1 | API mutations (`diseases`, `flag-categories`, `flags`, `patients` POST/PUT/PATCH/DELETE) had **no role check**; a `staff` user could change data through the API | **[FIXED]** `requireApiIdToken` / `requireAuthenticatedIdToken` now take a `{resource, action}` permission and return 403; mutating routes use it. Disabled accounts also get 403 |
| S2 | `normalizeUserRole` failed open: any unknown/missing role became `super_admin` | **[FIXED]** only `super_admin` (and legacy `admin`) map to admin; everything else is `staff` |
| S3 | **Flag categories and flags are global**, not per tenant: any tenant's super admin can create, rename or delete flags every clinic shares | **[OPEN][DECISION]** Needs a data-model change: move to `businesses/{id}/flagCategories`, keep a read-only global seed, migrate with the existing script. Until then only `super_admin` can mutate (S1) |
| S4 | Middleware only checks that a `__session` cookie exists, not that it is valid | **[OPEN]** Edge middleware cannot call Admin SDK; mitigate by verifying in the `(Navigations)` layout via an `/api/auth/me` check and by shortening cookie lifetime. API routes already verify tokens |
| S5 | No `firestore.rules` file in the repo; medicine create/update/delete and most billing/settings writes go straight through the client SDK, so Firestore rules are the only protection | **[OPEN]** Add `firestore.rules` + `firestore.indexes.json`, test with the emulator, deploy via CI. Test project currently uses `allow read, write: if request.auth != null` (fine for tests only, **never for production**) |
| S6 | Stale/expired session: a leftover server cookie with no Firebase user caused a blank page and a redirect loop (`/` ↔ `/dashboard`) | **[FIXED]** restore clears the cookie; protected layout shows "Redirecting to sign in" instead of null. Verified in the browser |
| S7 | Login ignored the `?redirect=` target | **[FIXED]** returns to the requested page; only same-origin relative paths are accepted. Verified |
| S8 | Path ids are interpolated into Firestore REST paths without validation | **[OPEN]** Validate ids against `^[A-Za-z0-9_-]+$` in route handlers |
| S9 | `npm audit`: 37 vulnerabilities (2 critical, 26 high) | **[OPEN]** Triage after removing unused deps; upgrade Next/Firebase patch versions |
| S10 | Security headers (CSP, X-Frame-Options, Referrer-Policy) absent | **[OPEN]** Add in `next.config.ts` |
| S11 | Self-disable and silent failures in Settings | **[FIXED]** a user cannot disable their own account; all settings saves have try/catch + toasts |

### 2.2 Data-correctness bugs

| # | Finding | Status |
|---|---|---|
| D1 | `/api/v1/patients/list` returned **500** and the page showed "0 patients" if any patient had no `createdAt` | **[FIXED]** null-safe sort in route and hook |
| D2 | Firestore REST list ignored `nextPageToken`, so collections beyond one page were silently truncated (also affected roll-number generation → duplicate roll numbers) | **[FIXED]** reader follows page tokens (`pageSize=300`). Still untested with more than one page |
| D3 | Flag labels were forced to camelCase for display (`30C` → `30c`, `Liquid dilution` → `liquidDilution`) | **[FIXED]** label keeps what the user typed; `value` stays camelCase. Existing flags keep their old labels; re-edit to restore case |
| D4 | Dashboard "Enrollment Trends" was **fabricated** (active patients minus constants), plus fake "+12% YoY", fake trend arrows, fake "Upcoming Prescriptions: Math Finals…" | **[FIXED]** real monthly cumulative counts from `createdAt`; fake cards removed |
| D5 | Dashboard attendance gauge read a legacy school `inventory` attendance collection | **[FIXED]** now "Stock Health" from stock items vs reorder level |
| D6 | Dashboard "Purchase Records" and "Active Medicines" showed the same number | **[FIXED]** second tile is now Staff Members |
| D7 | Medicine hero totals changed with the search ("0 active · 0 total" while one exists) | **[FIXED]** totals come from the last unfiltered load |
| D8 | Inventory is stored in browser `localStorage`, seeded with mock items, not linked to the vault, movements say "By Admin" | **[OPEN][DECISION]** Move to Firestore (`businesses/{id}/stockItems`, `stockMovements`, batches subcollection); link `medicineId` to the vault; record the real user. This is the biggest functional gap |
| D9 | Receiving stock accepted past expiry dates, zero quantity, empty batch | **[FIXED]** validated in `receiveStock` |
| D10 | Adjust stock can only remove stock (no count correction) and no "add item"/edit UI; `updateStockReorder` is unreachable | **[OPEN]** |
| D11 | Duplicate disease/category names silently return the existing record with 201; disease rename allows duplicates | **[OPEN]** Return 409 with a clear message |
| D12 | Medicines are in `businesses/{id}/medicines`, patients in `patients` (CLAUDE.md wrongly said `classes`) | **[FIXED]** docs corrected |
| D13 | Synthetic patient email `<roll>@patient.local` shown in Contact column | **[OPEN]** Store a real email or leave blank and hide |
| D14 | Patient detail edit mode can show raw ids (`chronic-migraine`, `arnica`) in badges until option lists load | **[OPEN]** Resolve labels from the loaded lists; show a skeleton until ready |
| D15 | Patient registration: blank extra medicine row blocks save; medicine picker has no way to add a medicine and no link to the vault | **[OPEN]** Ignore blank rows; add "Add medicine" link |
| D16 | Billing: no UI to create fee structures or billing categories, so Due is always 0 | **[OPEN][DECISION]** Add Fee structures management (Billing → Categories tab) |
| D17 | "Overdue" filter equals "has balance" | **[OPEN]** Add due dates to fee structures |
| D18 | Payment amount 0 accepted; overpay unchecked | **[PARTIAL]** amount must be > 0 (code-verified). Add max-balance/advance handling |

### 2.3 Prescriptions module — product decision needed

`/prescriptions` is **school-exam code with renamed strings** (Enter Marks, Subjects, Pass/Max score, Terms). Enter Marks can never work: it lists patients through `getMedicine()` which filters a `patientIds` field that medicine documents do not have, so "No patients to mark" always shows and Results stays empty.

- **[FIXED]** raw label keys in the create dialog, empty-state text, "exam" wording in labels, sidebar label ("Purchase History" → "Prescriptions"), wrong "No exams match" message.
- **[OPEN][DECISION]** Either (a) rebuild it as a **prescription register** over `patient.prescribedMedicines` (list by patient/visit/date, print/PDF, repeat prescription), or (b) remove it from the sidebar and routes. Recommendation: (a). The Firestore collections `prescriptionItems`, fields `examId/classIds/academicYear`, CSS class names `exams-*`, and the `metric-exams` colour token should be renamed with it.

### 2.4 UI / UX

| # | Finding | Status |
|---|---|---|
| U1 | No route-level loading state | **[FIXED]** `PageSkeleton` + `(Navigations)/loading.tsx` |
| U2 | Education-template icons (graduation cap) and wording (school, class, student, teacher, attendance) | **[FIXED]** in login, sidebar, loading screen, 404, dashboard, billing, settings, prescriptions labels. Remaining dead code is listed in 2.6 |
| U3 | Raw i18n keys on screen (`settings.tabAcademic`, `settings.saveAcademic`, `fees.noResults`, `patients.categories.general`, `prescriptions.selectClasses`) | **[FIXED]** |
| U4 | Wrong category tags on stat cards (e.g. "MEDICINES" on Stock Value, "BILLING" on Low Stock) | **[FIXED]** new `badge` prop on `AnimatedStat` |
| U5 | Export buttons did nothing (patients, billing, medicines, diseases) | **[FIXED]** CSV download via shared `downloadCsv`. Inventory Export still has no handler **[OPEN]** |
| U6 | Pagination: unlabelled icon buttons, only the first 5 pages reachable | **[FIXED]** labels + sliding window; same labels added to the 5 table-specific paginations. Better: replace those five copies with the shared `DataTablePagination` **[OPEN]** |
| U7 | Heading structure: pages had no `<h1>` (hero titles were `<h2>`) and the loading screen had an `<h1>` | **[FIXED]** one `<h1>` per page verified |
| U8 | Dashboard: blank "Recent Activity" box, infinite skeleton on error | **[FIXED]** empty state, error state with Retry |
| U9 | `error.tsx` hard-coded `h-screen`, grey text, no dark mode | **[FIXED]**. `global-error.tsx` still missing **[OPEN]** |
| U10 | Settings/profile forms accepted invalid email/phone; user creation failed silently | **[FIXED]** validation + toasts |
| U11 | Medicine form: "No flags found" hint had no link; empty vault list had no call to action | **[FIXED]** link and "Add Medicine" CTA |
| U12 | Tables clip on mobile (patients table 1280 px in a 1094 px card at desktop; billing "Due" truncated at 375 px; actions off-screen) | **[OPEN]** Use compact card list under `md` by default, sticky actions column, drop low-value columns (email/address) |
| U13 | Search runs only on Enter (patients, medicines, diseases); placeholder truncated on mobile | **[OPEN]** Debounced live search (300 ms), shorter placeholder |
| U14 | Filtering swaps the whole page for a skeleton | **[OPEN]** Inline spinner / keep previous data |
| U15 | Settings: no show/hide password, no confirm before disabling a user | **[OPEN]** |
| U16 | Forgot-password is `alert('coming soon')` | **[OPEN]** Use `sendPasswordResetEmail` |
| U17 | No user menu or notification bell in the header; logout only in the sidebar | **[OPEN]** Add menu; feed bell from low-stock/expiry |
| U18 | Disabled "Pay" buttons and disabled Create buttons give no explanation | **[OPEN]** Tooltips / helper text |
| U19 | Patients hero says "3 active patients across 3 total records" using the same number twice; "Total Patients" chip looks like a button | **[OPEN]** |
| U20 | Flag configuration: no rename/delete category UI (rename API exists), right pane says "Select a category" even when none exist, no "seed defaults" action | **[OPEN]** |

### 2.5 Loading speed and performance

Production build (First Load JS): login `/` **758 kB**, `/register` 758 kB, dashboard 519 kB, patients 456 kB, settings 460 kB, vault 375–437 kB; shared 100 kB. Content-ready 1.7–2.9 s.

| # | Finding | Status |
|---|---|---|
| P1 | Login/register ship 758 kB first-load JS (carousel/animation showcase) | **[OPEN]** Lazy-load `auth-deferred-showcase` and animation libs; target < 250 kB |
| P2 | Everything waterfalls behind auth init: shell shows `LoadingScreen` until Firebase auth → profile read → token refresh → `/api/auth/session`, then each page fetches its own data | **[PARTIAL]** profile + token already parallel. **[OPEN]** Render the shell from the cached profile immediately and verify in the background; do not block on `getIdToken(true)` (use `false` unless expired); call `/api/auth/session` only when the cookie is missing |
| P3 | Whole collections are fetched (`listCollection`), lists capped at 200, duplicate fetches on mount (patients list loaded twice; `/medicines/list` 2–4× in dev) | **[PARTIAL]** REST pagination fixed correctness. **[OPEN]** server-side pagination/search with `startAfter`; dedupe the year-options request; React Query/SWR cache |
| P4 | Disease pages call `/api/v1/flags` (all categories and flags) just to get symptoms | **[OPEN]** Add `/api/v1/flag-categories/{id}/flags` usage |
| P5 | Dashboard needs ~6 collection reads, including legacy `inventory` attendance | **[PARTIAL]** gauge no longer depends on attendance. **[OPEN]** replace with count aggregation queries (`getCountFromServer`) |
| P6 | Charts: Recharts and ECharts both installed | **[PARTIAL]** dashboard chart lazy-loaded. **[OPEN]** drop one library |
| P7 | Each API request makes 2–3 round trips (verify token → users doc → data) | **[OPEN]** Cache the profile for the request (or put role/business in custom claims) |
| P8 | Mixed lockfiles; `images.unoptimized`; `assetPrefix: '/'` | **[OPEN]** |
| P9 | Vercel Speed Insights script 404'd and logged console errors off Vercel | **[FIXED]** rendered only when `VERCEL` is set |

### 2.6 Build, dependencies, repo hygiene

| # | Finding | Status |
|---|---|---|
| B1 | `next build` needed Admin secrets at import time | **[FIXED]** lazy `adminAuth` / `adminDb` proxies |
| B2 | `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are `true` | **[OPEN]** tsc is clean now, so turn the flags off and add lint to CI |
| B3 | No automated tests | **[OPEN]** see section 4 |
| B4 | Unused deps (`formik`, `yup`, `axios`, `jsonwebtoken`, `next-auth`); `tsx` undeclared; two lockfiles and two ESLint configs; `pnpm` not installed locally | **[OPEN]** Needs a package manager decision; remove deps, add `tsx` + `@playwright/test`, delete the other lockfile |
| B5 | Dev/test pages public in production | **[FIXED]** `/test-shadcn`, `/test-tailwind` return 404 in production (verified) |
| B6 | Dead school code: `medicine-detail-tabs.tsx` (teachers tab), `labels.ts` `staff` block and unused medicine keys (`avgClassSize`, `homeroom`, `allGrades`), `medicines-form-dialog.tsx` `teachers`, `pharmacy-api.getMedicine`, legacy attendance/inventory functions, `rewrite_anthro.js`, nutrition scripts, `public/manifest.json` icon path | **[OPEN]** Delete |
| B7 | Mixed CRLF/LF line endings in the working tree after tooling edits | **[OPEN]** Add `.gitattributes` (`* text=auto eol=lf`) and normalise once |
| B8 | `deploy-to-gcloud*.sh` referenced in package.json but missing | **[OPEN]** |

---

## 3. Prioritised roadmap

**Phase 1 — done in this audit** (all [FIXED] items above): lazy Admin init, API role checks, fail-closed roles, session-loop fix, redirect-after-login, null-safe patient list, REST pagination, real dashboard data, settings/billing validation and error handling, CSV exports, wording/label cleanup, a11y labels and headings, skeletons, dev-page gating.

**Phase 2 — next (1 week), no product decisions needed**
1. B2 + B3: turn off build-error suppression; add `@playwright/test` with the public + authenticated suites from section 4; GitHub Actions (tsc, lint, build, Playwright against the test project).
2. S5: `firestore.rules`, `firestore.indexes.json`, emulator tests; S8 id validation; S10 headers.
3. P1, P2: shrink login bundle; render the shell from cached profile; stop forcing token refresh.
4. U12–U14: mobile card lists, debounced search, no full-page skeleton on filter.
5. D10, D11, D14, D15, D13: inventory adjust types, 409 on duplicates, label resolution, blank-row handling, no synthetic emails.
6. B4, B6, B7: dependency/lockfile cleanup, delete dead school code, `.gitattributes`.

**Phase 3 — needs owner decisions (2–3 weeks)**
1. D8: move inventory to Firestore and link it to the vault; wire low-stock and expiry alerts to the dashboard and a notification bell.
2. 2.3: rebuild or remove Prescriptions.
3. D16/D17: fee-structure management and due dates for Billing.
4. S3: per-tenant flag taxonomy (migrate global flags).
5. P3: server-side pagination and search, count aggregations, caching layer.

**Phase 4 — product polish**
Forgot-password flow, user menu and profile page, receipt/PDF printing for payments and prescriptions, patient visit timeline, global search, i18n (the label file is already centralised), role-based UI (hide Add/Delete for staff), audit log (`activities` collection already exists).

---

## 4. Test plan (to implement)

1. Install `@playwright/test`; `playwright.config.ts` with `webServer` = `next start`, projects: desktop-light, desktop-dark, mobile.
2. **Public suite** (no secrets): login render, validation messages, wrong password, register validation, protected-route redirect matrix for all 14 routes with `?redirect=`, `/vault` and `/medicines` redirects, 404, `/test-*` return 404, no console errors.
3. **Authenticated suite** (test project; `.env.test`): sign in once, reuse `storageState` **with IndexedDB** (Firebase client auth lives there; a state file without it renders blank pages). For every page: loads, `main h1` visible, no console errors/failed requests, no overflow at 375, no unnamed buttons, no raw `a.b.c` label keys.
4. **CRUD journeys**: patient (create → view → edit → delete), medicine, disease, flag category + flag, stock receive/adjust, payment, settings profile and user creation, staff-role restrictions (needs a second test user).
5. **Seed script** for the test project (users/business doc, a few flags, medicines, fee structure) so lists are never empty; reset script between runs.
6. **Performance budget**: assert content-ready < 3 s and first-load JS per route in CI; add Lighthouse CI for `/` and `/dashboard`.
7. Convert `scripts/verify-*.ts` into Vitest unit tests (roll number, registration payload, auth token round trip, `downloadCsv`, `buildPatientTrend`, permission matrix incl. fail-closed role).

Test-environment notes: the login page renders duplicate inputs (one hidden); use `input:visible`. Dev-mode `next dev` shared by several browsers becomes CPU-bound — use `next start` for timing. Running `next build` overwrites the `.next` folder a running dev server uses and breaks its assets (all JS/CSS return 400); stop the dev server first.

---

## 5. Test data left in the test project

`businesses/{uid}` (test clinic), patients `zz_p1`, `zz_p2`, "Test Patient Edited", feeStructures `zz_f1/zz_f2`, billingCategories `zz_c1`, a few flags/diseases/medicines created by the audit agents. The test project's Firestore rules are open to any signed-in user; do not copy them to production.

## 6. Owner decisions needed

1. Prescriptions: rebuild as a prescription register (recommended) or remove?
2. Inventory: confirm moving stock to Firestore (changes where data lives; existing localStorage mock data would be discarded).
3. Flags: accept per-tenant taxonomy with a one-time migration?
4. Package manager: pnpm (lockfile present, not installed here) or npm?
5. Billing: confirm fee structures and due dates belong in scope.

---

## 7. Status update — stock-first delivery (2026-10-16, later the same day)

Items above that changed state:

| Ref | Was | Now |
|---|---|---|
| D8 Inventory in `localStorage` | OPEN | **FIXED**: Firestore (`stockItems`, `stockMovements`), transactions, FEFO, expiry-aware, real user on every movement |
| D10 Adjust only removes / no add-edit UI | OPEN | **FIXED**: add/edit/delete item, count corrections in/out, returns, expired write-off |
| S5 No Firestore rules | OPEN | **FIXED**: `firestore.rules` + 108 emulator tests; deploy per `docs/DEPLOYMENT.md` |
| S8 / API role checks / fail-open roles | PARTIAL | **FIXED** (roles); id validation still open |
| B2 Build checks suppressed | OPEN | **FIXED**: type and lint errors fail the build |
| B3 No tests | OPEN | **FIXED (core)**: rules tests, Playwright 46 tests (public, all pages desktop+mobile, stock journey) |
| B4 Deps / lockfiles / eslint config | OPEN | **FIXED**: npm only, unused deps removed, flat ESLint config only |
| B6 Dead school/nutrition code | OPEN | **PARTIAL**: orphan components/scripts deleted; dead labels and legacy `pharmacy-api` attendance functions remain |
| B7 Line endings | OPEN | **FIXED**: `.gitattributes` (`eol=lf` for new checkouts) |
| U16 Forgot password alert | OPEN | **FIXED**: Firebase reset email |
| U17 Header bell | OPEN | **FIXED (stock)**: alerts bell in the header |
| P9/CSP | n/a | Security headers + CSP added; production test caught that Firebase Auth needs `apis.google.com` and it is allowed |

Still open (unchanged): Prescriptions module (2.3), per-tenant flags (S3), billing fee structures (D16/D17), login bundle size (P1), server-side pagination (P3), middleware cookie validation (S4).

Verification of this state: `npm run verify` exit 0 (typecheck, lint 0 errors, 108 rule tests, build), Playwright 46/46 on a production build.
