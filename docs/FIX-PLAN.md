# MediFlow Fix Plan

## Outcome (23 Oct 2026)

Implemented on the working tree (nothing committed, pushed or deployed to production). Verified locally: typecheck (app + tests), lint, 34 unit tests, 160 rules tests, 4 verification scripts, production build, 55 Playwright tests (46 original + 9 axe accessibility) against the TEST Firebase project, plus live API checks and a 24-screenshot before/after comparison (pixel-identical after the CSS cleanup).

| Phase | Result |
|---|---|
| 0 Quick wins | Done: `eslint .` replaces `next lint`, `tsconfig` ES2022 + `noImplicitReturns`/`noFallthroughCasesInSwitch`, tests are type-checked, redirects non-permanent, `prod` alias, rules tests gate `deploy-rules.yml`, `--legacy-peer-deps` no longer needed. Not enabled: `noUncheckedIndexedAccess`. |
| 1 Read cost | Done: bounded page + server count for unfiltered patient/medicine lists, patient detail by query, roll number by one indexed read, dashboard by counts, stock freshness cache, flag cache, medicines cache, billing grouped O(N+P) with a client-side overdue filter. **Adapted:** search/filter requests still scan the collection (substring search kept; D1 not applied); billing still reads patients + fees + payments once per visit. |
| 2 Tenancy / sign-up | Done: per-clinic flag taxonomy with lazy seeding from a read-only template, registration closed unless `ALLOW_REGISTRATION=true` (legacy public flag still honoured), Firestore-backed rate limiter on registration and user creation. **Adapted:** no Redis; the session route is not limited (Firebase Auth throttles sign-in); the 409 "email exists" reply is kept so people can tell why sign-up failed. |
| 3 API layer | Done: shared `DomainError`/`errorResponse`/`parseJsonBody`, Zod schemas, `safeSegment`, whitelisted patient updates with immutable ID, 8 s timeouts, outages no longer look like "not found", single `ApiAuthError`. |
| 4 Rules | Done: patient and payment validation, immutable roll number, stock changes tied to a ledger entry, staff cannot delete prescription items, legacy collections denied. |
| 5 Boundaries / metadata | Done: `global-error.tsx`, `(Navigations)/error.tsx`, per-section titles + title template + manifest + noindex, 34 presentational components no longer `'use client'`, inventory form dialogs lazy-loaded. **Not adopted:** route `loading.tsx` (causes hydration mismatch, see CLAUDE.md) and server-component page shells (conflicts with the "static content paints at once" rule and needs a larger refactor). |
| 6 CSP / auth | Done: nonce CSP with `strict-dynamic`, narrowed `connect-src`, open-redirect fix with tests, same-origin check on cookie routes. **Not done:** middleware JWT verification (S5) and trimming the cached profile (S6), both documented trade-offs; `style-src` keeps `'unsafe-inline'`. |
| 7 Accessibility | Done: contrast of every brand button/badge/label flagged by axe, table rows no longer fake buttons, `scope`/`aria-sort`/captions, skip link, combobox names, flag list semantics, profile button name. axe now passes (serious + critical) on 9 pages in light mode. Not done: the dangling `aria-describedby` in `ui/form.tsx`, dark-mode axe run. |
| 8 Hooks | Done: latest-request-wins guards in patients and medicines directories, ESLint rule against barrel imports. **Not done:** URL-synced filters (W22), memoised rows (S11), date-picker effect refactor (S9). |
| 9 Cleanup | Done: 88 unused source files, 19 packages + tailwind plugins, legacy service functions, FAM scripts, `globals.css` 6,464 to ~3,200 lines with all dead animations removed. **Not done:** splitting `pharmacy-api.ts`, one toast system, token clean-up of hard-coded colours (S14), `?? {}` casts in two detail views. |
| 10 Tests / CI | Done: Vitest suite, axe specs, no fixed sleeps, `e2e.yml` (nightly/manual against the TEST site, skips cleanly without secrets). |
| 11 Privacy | Done: list responses carry list columns only. Aadhaar is not collected by the live registration form, so no masking UI was needed. |

### Before this goes anywhere else

1. **The new Firestore rules are already published to the TEST project** (`mediflow-test-11bbe`). The currently deployed test site still runs the old code, whose stock updates carry no `lastMovementId` and whose flag screens write to the old global path, so those two actions fail there until this work is deployed to `dev`.
2. Production gets everything only through a `dev` to `main` PR. The rules deploy workflow publishes `firestore.rules` on merge.
3. Optional settings: a Firestore TTL policy on `rateLimits.expiresAt`; `ALLOW_REGISTRATION=true` in Vercel (the existing `NEXT_PUBLIC_ALLOW_REGISTRATION=true` keeps working); GitHub variable `E2E_BASE_URL` and secrets `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` for the nightly e2e run.
4. Not verified locally: a clean `npm ci` on Linux CI (the lockfile was regenerated without `--legacy-peer-deps`; `npm ci --dry-run` passes).

---

## Original plan

Source: `docs/NEXTJS-CODE-REVIEW.md` (4 Critical C1-C4, 30 Warnings W1-W30, 17 Suggestions S1-S17).
Status: see the outcome section above (the text below is the plan as first written).

## Ground rules (apply to every phase)

1. **Git:** no commit, push, branch, merge or PR without your explicit yes for that step. Each phase ends with a "Ready to commit?" question, never an action.
2. **Environments:** all testing runs against the Firebase **test** project (`mediflow-test-11bbe`) and the local emulator. Never against `mediflow-prod`.
3. **Quality gate after every phase:** `npm run typecheck`, `npm run lint`, `npm run test:rules`, then a production build in its own folder (`NEXT_DIST_DIR=.next-prod npm run build`) so your `next dev -p 4000` is never disturbed.
4. **Rollout path per phase:** local, then `dev` (auto-deploys to the test site and publishes rules to the test project), manual check on the test site, then a `dev` to `main` PR (needs green `verify`). Rules changes go to prod only through that PR.
5. **Read-quota safety:** the test project's free read quota was exhausted before. Run Playwright only after Phase 1 lands, and run it sparingly.
6. **One phase = one reviewable change set** (a branch or PR per phase, only when you approve), so any phase can be reverted alone.

## Phase map and order

| Phase | Theme | Fixes | Effort | Depends on |
|---|---|---|---|---|
| 0 | Safety net and quick wins | S1, S12, S13, S16 (partial), W24 | 0.5 day | none |
| 1 | Firestore read cost | C1, C2, C3, W16, W17, W18 | 4-5 days | 0 |
| 2 | Tenant isolation and sign-up | C4, W4, W5 | 2-3 days | 0 |
| 3 | API validation and error layer | W6, W7, W8, W9, W14, S7, S8 | 3 days | 0 |
| 4 | Rules hardening | W11, W12, W13 | 2 days | 3 (shared field list) |
| 5 | Error, loading and metadata | W1, W2, W30, S3, S10 | 3 days | 1 |
| 6 | Security headers and auth hardening | W3, W10, S4, S5, S6 | 2-3 days | 2 |
| 7 | Accessibility | W25, W26, S17 | 2 days | none |
| 8 | State and hooks | W19, W20, W22, S9, S11 | 2-3 days | 1 |
| 9 | Dead code and CSS cleanup | W21, W27, W28, W29, S2, S14 | 3 days | 7, 8 |
| 10 | Tests and CI | W23, S15 | 3 days | 1-4 |
| 11 | Privacy | W15 | 1 day | 3 |

Total about 27-31 working days for one developer. Phases 2, 3, 7 can run in parallel with Phase 1 if two people work.

---

## Phase 0: Safety net and quick wins

**Goal:** make later phases safer and cheaper to verify.

| Step | Issue | Files | Action |
|---|---|---|---|
| 0.1 | S1 | `package.json`, `tsconfig.json`, `eslint.config.mjs` | Run the Next codemod to replace `next lint` with `eslint .`. Add `ignores: ['.next*/**']`. Set `target: ES2022`, `lib: esnext`, remove the stale `.next-dev5` include. Add `noImplicitReturns`, `noFallthroughCasesInSwitch`. Add `noUncheckedIndexedAccess` last and fix the fallout in a separate pass. Add `tests/tsconfig.json` so test code is type-checked. |
| 0.2 | S12 | `next.config.ts:71-72` | Change `/medicines` redirects to `permanent: false`. |
| 0.3 | S13 | `.firebaserc` | Add the `prod` alias. |
| 0.4 | S16 | `CLAUDE.md`, `package.json` | Remove the ECharts claim, bump `@types/node` to `^22`, add a `format` script or remove prettier. Leave `--legacy-peer-deps` until Phase 9. |
| 0.5 | W24 | `.github/workflows/deploy-rules.yml` | Add Java setup and `npm run test:rules` before the publish step. |

**Verify:** `npm run verify` passes; lint prints no deprecation notice; a no-op rules change triggers the workflow on `dev` and the tests run first.
**Risk:** stricter `tsconfig` may surface many errors. Mitigation: enable flags one at a time.
**Rollback:** revert the single change set.

---

## Phase 1: Firestore read cost (C1, C2, C3, W16, W17, W18)

**Goal:** reads grow with page size, not collection size. Target: dashboard under 15 reads, patient list page under 30, stock load under 2x item count, nothing re-read on navigation within 60 seconds.

**1.1 Measure first.** Add a dev-only read counter (wrap the REST helper and the lite SDK calls, log count per route). Record before numbers for dashboard, patients, new-patient, billing, inventory. Keep them in the PR description.

**1.2 REST query support (`src/lib/firebase/firestore-rest.ts`).** Add `runQuery` (structuredQuery with `where`, `orderBy`, `limit`, `startAt/After` cursor) and an aggregation `runCount`. Use them in the steps below. Add the needed composite indexes to `firestore.indexes.json` (patients by status+createdAt, payments by patientId+date, feeStructures by patientId).

**1.3 Patients list (C1).** `src/app/api/v1/patients/list/route.ts`, `src/lib/patients/patient-server.ts`:
- Cap `limit` at 100 and validate `page`/`limit` as integers.
- Query with `orderBy(createdAt desc)`, `limit`, and a cursor. Filters (status, class, year) become `where` clauses.
- Search: store a lowercase `searchKey` (name + roll number + phone) on create and update, and query by prefix range. Backfill existing documents with a one-off script `scripts/backfill-patient-search-key.ts` (dry run by default, `--apply` flag, test project first).
- Total count via `runCount`, not by loading all rows.
- Client hook `use-patients-directory.ts`: request page size 10-20 and use the cursor for next page.

**1.4 Patient detail (C1).** Replace the all-fees, all-payments reads with `where patientId == id` queries (`patient-server.ts:137`).

**1.5 Roll numbers (C1).** Replace "list all patients to find the next number" with a counter document `businesses/{b}/counters/rollNumbers-YYYYMM` incremented inside a transaction (patients create already uses a `rollNumbers` reservation). Update `scripts/verify-patient-roll-number.ts` accordingly. Add a rule for `counters` (member read, member write with integer check).

**1.6 Medicines and diseases lists (C1).** Same query pattern as 1.3 for `/api/v1/medicines/list` and the disease list. For the dropdowns that need names only (W17), see 1.9.

**1.7 Dashboard (C2).** `getDashboardStats` in `src/services/pharmacy-api.ts`:
- Active patients and medicines via `getCountFromServer`.
- Month fees via `getAggregateFromServer(sum('amount'))` over a date-bounded query.
- Staff count via count query on `users where businessId == b`.
- Delete the `inventory` read and the attendance tile (or replace with a stock-health tile fed from the Redux store).
- Dashboard page reads stock from Redux (see 1.8), not a second `fetchStockItems()`.
- Keep the 8-item activity query.

**1.8 Stock (C3).** `src/redux/slices/stockSlice.ts`, `profile-menu.tsx`, `use-stock-directory.ts`:
- Split into `loadStockItems` and `loadStockMovements`. The bell and dashboard use items only. Movements load only when the movements tab opens.
- Add `lastLoadedAt` and a `condition` that skips the fetch when data is under 60 seconds old (force flag for manual refresh).
- Mutations return the changed item and the new movement; the reducer patches state instead of refetching everything.

**1.9 Shared reference data (W16, W17).** New `src/lib/reference-data-cache.ts` (module cache with TTL 10 minutes, in-flight promise dedupe) for flags, medicine names and disease names. Hooks `use-medicine-flag-options`, `use-disease-flag-options`, the patient registration form and the patient detail page all read from it. Flag, medicine and disease mutations call `invalidate()`.

**1.10 Billing (W18).** `fetchPatientFeeSummaries`: group fees and payments once into `Map<patientId, …>` (O(N+P)). Make `overdueOnly` a client-side `useMemo` filter, not a refetch dependency. Optional later step: keep `totalPaid` and `totalDue` on the patient document, updated in the payment transaction.

**Verify:**
- Read counter shows the target numbers (record after values).
- Seed 500+ patients in the test project (script, clearly marked test data) and confirm list, search, pagination and roll-number creation still work.
- Rules emulator tests for the new `counters` rule.
- Playwright smoke (single run) for the 12 pages.
**Risk:** search behaviour changes from substring to prefix. Mitigation: agree this with you before 1.3 (decision D1 below). Missing index errors: deploy indexes before the code.
**Rollback:** each sub-step is independent; indexes and the backfill field are additive.

---

## Phase 2: Tenant isolation and sign-up (C4, W4, W5)

**Goal:** no tenant can affect another; registration closed by default; abuse limited.

**2.1 Decide the model (decision D2).** Option A (recommended): per-tenant taxonomy at `businesses/{b}/flagCategories/**`, writable by that business's `super_admin`. Option B (interim, small): keep the global taxonomy but only an operator with a `platformAdmin` custom claim can write.

**2.2 Option A implementation.**
- Rules: add the per-tenant match; make the global path read-only for everyone (seed data only).
- Migration script `scripts/migrate-flags-to-tenant.ts`: copies the global taxonomy into each existing business (dry run by default, `--apply`, test project first). Extend the existing `migrate-flag-categories-to-global.ts` style.
- `src/lib/flags/flag-server.ts`, the `/api/v1/flag-categories/**` routes, and `flag-api.ts`: use the tenant path and `businessId`.
- Medicines and diseases store flag values by value (not id), so no data rewrite is needed.
- Add rules tests: tenant A cannot read or write tenant B flags; staff cannot write.

**2.3 Registration (W4).**
- New server-only `ALLOW_REGISTRATION` (default closed, must equal `'true'`), read at request time in `register/route.ts` and `middleware.ts`. Keep `NEXT_PUBLIC_ALLOW_REGISTRATION` only to show or hide the UI link.
- You said you want more people to use the app: so registration stays **open** on prod by setting `ALLOW_REGISTRATION=true` in Vercel (a one-time setting, changes need a redeploy). The code default becomes closed so a forgotten variable can no longer open it. Update `.env.example`, `docs/DEPLOYMENT.md` and the Vercel setup guide.

**2.4 Rate limiting and enumeration (W5).**
- Shared limiter (Upstash Redis via Vercel Marketplace) or Vercel Firewall rate-limit rules on `/api/auth/*` and `/api/admin/users`. Decision D3 below.
- Registration returns one generic message for "email exists" (or sends the verification mail first). Remove the module-level `Map`.

**Verify:** rules tests for both tenants; manual: two test businesses cannot see each other's flags; registration blocked when variable is unset; limiter returns 429 after 5 tries in 10 minutes.
**Risk:** migration touches all tenants. Mitigation: dry run, backup export of `flagCategories`, test project first.
**Rollback:** keep the global rules read path until the migration is verified; revert code, data is copied not moved.

---

## Phase 3: API validation and error layer (W6, W7, W8, W9, W14, S7, S8)

**Goal:** every route validates input and returns safe, correct status codes.

1. **3.1 Shared modules** (`src/lib/api/`): `api-auth-error.ts` (single `ApiAuthError`, S7), `domain-error.ts`, `to-response.ts` (maps ApiAuthError, DomainError, Zod errors, Firestore HTTP errors to safe status and message; logs the rest, returns generic 500), `route.ts` (wrapper from the review's refactor 3).
2. **3.2 Schemas** (`src/lib/schemas/`): disease, flag category, flag, patient create, patient update (strict, explicit editable fields, no `id`, `createdAt`, `rollNumber`), medicine, admin user create. Reuse the existing registration Zod schema where it applies. Types come from `z.infer`.
3. **3.3 Apply the wrapper** to all 17 API handlers. Replace `body as X` casts. Fix `POST /api/admin/users` (W6): use `requireApiSession`, Zod, 409 for existing email, 401 for auth failures.
4. **3.4 Firestore REST helper (W14, W8, S8):**
   - `FirestoreHttpError` with status; `fetchFirestoreDocument` returns `null` only on 404 and throws otherwise.
   - `AbortSignal.timeout(8000)` on every fetch.
   - Encode `updateMask.fieldPaths` (backtick-quote and `encodeURIComponent`).
   - `seg()` validator for ids used in paths.
5. **3.5 Client handling:** make `loadProfile` and the auth slice treat 5xx and timeout as "temporary error, retry" rather than signed out.

**Verify:** unit tests (Phase 10 adds Vitest) for schemas and `to-response`; manual malformed-body checks with curl against the test site; confirm a Firestore outage simulation (bad token path) returns 403/502, not 404.
**Risk:** stricter validation can reject data the UI sends today. Mitigation: log-only mode for one release, or run the registration and patient e2e flows before merging.

---

## Phase 4: Rules hardening (W11, W12, W13)

**Do after Phase 3** so the rules and Zod schemas share one field list.

1. **W11:** add `validPayment()` (amount number, 0 < amount <= limit, patientId string, bounded strings) and `validPatient()` (types and max lengths; `rollNumber` and `createdAt` immutable on update; only editable keys via `hasOnly`). Apply to create and update.
2. **W12:** split `prescriptionItems` into create/update for members and delete for admins. Remove `inventory` and the other legacy wildcard names (`staff`, `classes`) after confirming no code reads them (Phase 9 dead-code step).
3. **W13:** require a paired movement. Add `lastMovementId` to stock items; update rule checks `getAfter()` on the movement and that `balanceAfter == totalQuantity`. Update `stock-api.ts` transactions to write both. Alternative if `getAfter` limits get in the way: move stock mutation to a server route.
4. Tests: negative amount rejected, extra keys rejected, rollNumber immutable, staff cannot delete prescriptionItems, stock change without movement rejected. Update the existing tests that write `{ any: 'shape' }`.

**Verify:** `npm run test:rules` (must stay green and grow), then a full manual pass of patients, billing, stock on the test site, because tight rules can break legitimate writes.
**Risk:** high; a too-strict rule blocks real workflows. Mitigation: ship to test first, run the 46 e2e tests once, soak for several days before the main PR.
**Rollback:** `firestore.rules` revert redeploys through the same workflow.

---

## Phase 5: Error, loading and metadata (W1, W2, W30, S3, S10)

1. **5.1** `src/app/global-error.tsx` (own `<html>`, retry and back-to-sign-in), `src/app/(Navigations)/error.tsx` (content-area error, sidebar stays), `src/app/not-found.tsx` check. Send errors to a logger hook (Sentry later, decision D4).
2. **5.2** `src/app/(Navigations)/loading.tsx` using `PageSkeleton`; wrap `useSearchParams` consumers in `<Suspense>`.
3. **5.3 Server shells:** per section, make `page.tsx` a server component that renders the static `PageHero` and a client island (`*Directory`) for data. Start with patients, vault, billing, inventory; the dashboard last. This respects the "static paints at once" rule in `CLAUDE.md`.
4. **5.4 Metadata (W30):** `title.template`, `manifest`, `robots: noindex` in the root layout; a `metadata` export per section via the server shells.
5. **5.5 S3:** remove `'use client'` from presentational components (after 5.3 so server composition benefits).
6. **5.6 S10:** `next/dynamic` for the login 3D scene and video (after first paint), and rarely opened dialogs.

**Verify:** throw a test error in a page and in a provider (temporary, local only) and confirm the right boundary shows; check the tab title per page; compare first-load JS per route before and after (`next build` output).
**Risk:** moving pages to server shells touches every route. Mitigation: one route at a time, e2e after each batch.

---

## Phase 6: Security headers and auth hardening (W3, W10, S4, S5, S6)

1. **W3:** replace the redirect check in `login-form.tsx:78-82` with the `URL`-origin check (`/\evil.com` rejected). Unit tests for `//x`, `/\x`, `https://x`, `javascript:`, `/ok?x=1`.
2. **W10 CSP:** nonce-based CSP in `middleware.ts` with `strict-dynamic`. Narrow `connect-src` to the Firebase endpoints in use, drop `https:` from `img-src` unless needed, test removing `apis.google.com`. Roll out first as `Content-Security-Policy-Report-Only`, watch the console on all pages (login, every section, test and prod Firebase), then enforce. Note: a nonce makes pages dynamic; confirm no static-page performance regression (decision D5 if it matters).
3. **S4:** Origin and `Sec-Fetch-Site` check helper applied to the five cookie POST routes.
4. **S5:** verify the session cookie in middleware with `jose` and Google's session-cookie public keys (Edge-compatible), or accept the documented trade-off (decision D6).
5. **S6:** gate role-based UI on `sessionVerified`; reduce the cached profile to id and name.

**Verify:** headers inspected on the test site; CSP report-only console clean on every page; login redirect unit tests.
**Risk:** CSP can break Firebase auth or fonts silently. The report-only stage exists for that.

---

## Phase 7: Accessibility (W25, W26, S17)

1. **W25:** `.page-hero-primary` to `hsl(160 84% 24%)` (about 6:1), dark variant `hsl(160 84% 30%)`; badge text darker in light and lighter in dark. Re-compute every ratio and record it in the PR. Check other accent buttons with the same pattern. (Visual change; confirm with you that the darker green is acceptable, since you asked to keep the theme: decision D7.)
2. **W26:** tables for patients, medicines, diseases: make the name cell a real `<Link>`; keep row click as a mouse convenience only (no `tabIndex` on `<tr>`); `scope="col"` on all `<th>`; `aria-sort` on sortable headers; visually hidden `<caption>`. Card variant: remove `role="button"` wrapper, make the card title the link.
3. **S17:** skip link in the app layout; `role="status"` on empty states and result counts; fix the dangling `aria-describedby` in `ui/form.tsx:116`.

**Verify:** axe-core run (added in Phase 10) with zero violations on 12 pages; keyboard-only walkthrough; screen reader spot check.

---

## Phase 8: State and hooks (W19, W20, W22, S9, S11)

1. **W19:** `AbortController` in every directory hook; move `setPage(1)` into the filter setters; remove derived-state effects.
2. **W20:** replace barrel imports with direct imports; add `no-restricted-imports` ESLint rule for `@/components`, `@/hooks`, `@/components/ui` barrels in `src/app` and layouts. Fix `test-shadcn` or delete it in Phase 9.
3. **W22:** search, status, year, sort and page into the URL (`useSearchParams` plus `router.replace`), starting with patients and medicines. Server data stays in hooks; consider RTK Query or SWR only if Phase 1's cache module proves insufficient (decision D8).
4. **S9:** derive the date-of-birth value instead of chained effects; `key` the adjust and receive dialogs.
5. **S11:** `React.memo` row components after measuring (React Profiler) that it helps.

**Verify:** type quickly in search and confirm the last term wins; refresh keeps filters; back button restores state.

---

## Phase 9: Dead code and CSS cleanup (W21, W27, W28, W29, S2, S14)

Do this late: it is large, mechanical and easiest once behaviour is locked by tests.

1. **9.1 Prove it is dead:** run `npx knip` and grep importers; keep the list in the PR.
2. **9.2 Delete:** the 45 unused `components/ui` files, `test-shadcn`, `test-tailwind`, `NotificationContext` and `notification-bell`, legacy functions in `pharmacy-api.ts` (attendance, exam, inventory), school remnants in `labels.ts`, `create-env-*.sh` and their `package.json` scripts. Then `npm uninstall` the orphaned packages and re-run `npm ci`. Try dropping `--legacy-peer-deps` (fix real peer conflicts with targeted overrides).
3. **9.3 CSS (W27, W28):** delete unused `*-hero-mesh/-badge/-scanline` and school-era blocks, delete `@keyframes` with no live use, replace the universal `animation: none !important` with the narrow reduced-motion rule, remove `tailwindcss-animate` and the `animate-in/out` classes. Split `globals.css` into tokens, base and components. Do it in slices, with a screenshot comparison of the 12 pages (light and dark) after each slice.
4. **9.4 W29 / S2:** replace `as` casts (generic `createFirestoreDocument<T>`, `string | string[]` params), split `pharmacy-api.ts` into billing, settings and dashboard modules, keep one toast system.
5. **9.5 S14:** replace hard-coded colours with tokens, raise sub-12px text where it carries information. Opportunistic, not a blocker.

**Verify:** `npm run verify`; first-load JS and install size before and after; visual diff of all pages in both themes (theme itself unchanged).
**Risk:** removing something still used. Mitigation: typecheck and build catch import breaks; runtime-only class names are why the screenshot diff is needed.

---

## Phase 10: Tests and CI (W23, S15)

1. Add Vitest. Unit tests for `stock-utils`, `stock-stats`, `permissions`, the new schemas, redirect helper, `to-response`, FEFO adjust logic (pure parts).
2. API route tests with mocked Firestore REST for auth, role, validation and error paths.
3. Playwright: add a staff-user `storageState` project (role gating), registration flow, patient create and edit, billing payment, vault CRUD, settings user management. Replace the fixed `waitForTimeout(500)` with a poll on `aria-busy`. Add `@axe-core/playwright` checks. Allow parallel workers once data is isolated.
4. CI: Vitest and type-check of tests on every PR; Playwright on `main` PRs or nightly (protects the test project quota), using GitHub secrets `TEST_USER_EMAIL/PASSWORD` (you add them; I never handle them). Upload the Playwright report as an artifact.
5. Make the `verify` check name stay stable (the ruleset requires it).

**Verify:** a deliberately broken PR (temporary, local) fails the right job.

---

## Phase 11: Privacy (W15)

1. List route returns only list columns (`toListRow`); detail route returns the full record.
2. Mask Aadhaar in the UI by default (last 4 digits), reveal on click for admins; consider masking in the API for staff.
3. Decision D9: whether to encrypt or stop storing full Aadhaar numbers. Have the clinic or counsel confirm what is legally required before changing storage.

---

## Decisions I need from you

| ID | Question | My recommendation |
|---|---|---|
| D1 | Search: prefix match on name, roll number, phone acceptable instead of substring? | Yes (substring over thousands of records is what costs reads) |
| D2 | Flags: per-tenant taxonomy (A) or operator-only global (B)? | A |
| D3 | Rate limiting: Upstash Redis, or Vercel Firewall rules only? | Firewall rules first (no new service), Upstash if you need finer control |
| D4 | Add error tracking (Sentry)? | Yes, free tier, later |
| D5 | Accept dynamic rendering that a CSP nonce forces? | Yes (pages are client-rendered anyway) |
| D6 | Verify the session cookie in middleware (S5)? | Optional, low priority |
| D7 | OK to darken the green button and badge for contrast, keeping the theme? | Yes, small shade change only |
| D8 | Introduce RTK Query or SWR? | Only if Phase 1 cache is not enough |
| D9 | Aadhaar storage policy? | Clinic or counsel decides |

## Definition of done (whole plan)

- All 51 findings closed or explicitly accepted with a reason in the review file.
- Read counts at the Phase 1 targets, recorded.
- Rules tests grown to cover W11-W13 and cross-tenant flags; `npm run verify` green; Playwright green once on test.
- axe: zero serious violations on the 12 pages.
- `docs/NEXTJS-CODE-REVIEW.md` updated with a "resolved" column; `CLAUDE.md` and `docs/DEPLOYMENT.md` match the new behaviour.
- Prod receives each phase only through a green `dev` to `main` PR that you approve.

## Suggested start

Phase 0 (half a day), then Phases 1 and 2 together or back to back, because they remove the quota risk and the cross-tenant hole.
