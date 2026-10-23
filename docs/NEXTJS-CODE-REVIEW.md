# Next.js Code Review Report

> **Status (23 Oct 2026):** the fixes for this review were implemented and verified locally; see `docs/FIX-PLAN.md` for the per-finding outcome. This report describes the code as it was at commit `3407b54`.

Project: MediFlow (`liganexus-web-app`). Reviewed on branch `dev` at commit `3407b54`, 23 Oct 2026.

## 🔍 Project Snapshot

| Property | Detail |
|---|---|
| Router | App Router (consistent; no Pages Router files). Route groups `(auth)` and `(Navigations)`. 19 `page.tsx`, 12 `/api/v1` handlers, 5 other API routes |
| Next.js Version | 15.5.28 (`package.json`), React 19.1.2 |
| TypeScript | Yes. `strict: true`; 0 real `any` (the single grep hit is a comment), 0 `@ts-ignore`, 1 non-null assertion |
| Styling | Tailwind CSS 3.3.3 + shadcn/ui (Radix) + one 6,457-line `src/styles/globals.css`; `cn()` (clsx + tailwind-merge) and `cva` |
| Auth | Firebase Auth (email/password) + Firebase Admin session cookie `__session`; role-based access (`super_admin`, `staff`); Firestore security rules as the data guard |
| State Management | Redux Toolkit (`auth`, `ui`, `patients`, `stock` slices) + hand-rolled `useState` hooks per page; no query cache library |
| Testing | Firestore rules suite (emulator, ~110 cases) runs in CI; Playwright e2e (46 tests) exists but is **not** run in CI; no unit or component tests |
| Overall Health Score | **6.5 / 10** |

Size: 407 `.ts/.tsx` files under `src` (43,895 lines); 219 of them begin with `'use client'`; 24 files in `tests` and `scripts`.

---

## 📋 Executive Summary

The security architecture is better than most apps of this size: the server never uses the Admin SDK for data reads (it calls Firestore with the caller's own ID token, so the rules apply on every request), disabled users and revoked tokens are rejected on every route, roles fail closed, and the rules plus 110 emulator tests enforce tenant isolation. TypeScript is genuinely strict, there is almost no `any`, and the build fails on lint or type errors. The most urgent concerns are **cost and scalability**: every list, detail and dashboard load reads whole Firestore collections and filters in memory, stock is reloaded on every mount and mutation, and this already exhausted a free-tier read quota during testing. The second concern is a **cross-tenant integrity hole**: the global flag taxonomy is writable by the `super_admin` of any tenant, and sign-up is open by default. Below that sit missing error boundaries and loading states, ad hoc API validation, weak CSP, unvalidated payment and patient data in the rules, WCAG contrast failures on the main buttons, and a lot of dead code (45 unused UI files, about 12 packages, a 6.4k-line stylesheet). It is production-usable for a single clinic with registration closed, and it is **not yet ready for open multi-tenant use** until the Critical items are fixed.

**Method and honesty about coverage.** The review was done by reading the files in four slices (configuration and infrastructure; API, auth and security; client code and performance; types, accessibility, styling, dependencies and tests), then re-checking the high-impact claims against the code. Every Critical finding and many Warnings were re-verified against the cited lines (marked "verified" in the text). One agent claim was corrected during verification (see W1). **Not every file was read line by line**: the remaining ~300 component files were covered by pattern scans (hooks, directives, imports, casts, accessibility attributes), and the "Coverage and limits" section at the end lists what was not opened in full.

---

## ✅ Strengths

- **Server reads use the caller's identity.** `/api/v1/*` handlers call the Firestore REST API with the user's ID token (`src/lib/firebase/firestore-rest.ts:76-85`, `:102-122`), so `firestore.rules` is enforced on every server read and write; a bug in a handler cannot widen access beyond the rules.
- **Immediate revocation.** `src/lib/api/require-api-id-token.ts:54-77` verifies the token locally and, in parallel, checks `disabled` and `tokensValidAfterTime`; cookie routes use `verifySessionCookie(session, true)` (`require-api-session.ts:33`); logout revokes refresh tokens (`api/auth/logout/route.ts:21`).
- **Fail-closed roles and no self-escalation.** `normalizeUserRole` maps anything unknown to `staff` (`src/lib/permissions.ts:55-59`); rules deny browser creation of `users` and `businesses` (`firestore.rules:73`, `:109`) and limit self-updates to `name` (`:75-79`).
- **Disable-user is end to end.** `PATCH /api/admin/users/[id]` disables the Auth account, revokes tokens and updates the profile, refuses self-disable, and returns the same 404 for missing and other-tenant users (`src/app/api/admin/users/[id]/route.ts:24-61`).
- **Correct cookies and CSRF posture for `/api/v1`.** `__session` is `httpOnly`, `sameSite: lax`, `secure` in production, 14-day `maxAge` (`api/auth/session/route.ts:25-31`); `/api/v1` uses a Bearer header, so it is not CSRF-exposed.
- **No secrets reach the client.** The only `process.env` reads in client code are `NEXT_PUBLIC_FIREBASE_*` identifiers and the registration flag; Admin credentials are read only in `src/lib/firebase/admin.ts` and initialised lazily so `next build` needs no secrets.
- **Strong, mostly consistent TypeScript.** `tsconfig.json:6` strict; Zod `z.infer` is the single source for the registration form type (`src/lib/patient-registration-schema.ts`); only 5 `eslint-disable` comments, each with a reason.
- **Build and CI discipline.** `next.config.ts:52-55` fails the build on lint/type errors; `.github/workflows/ci.yml` runs typecheck, lint, rules tests and build with dummy public env (no secrets); `deploy-rules.yml` dry-runs before publishing and skips cleanly with no secret.
- **Security headers present** (`next.config.ts:5-47`): CSP with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, HSTS preload, nosniff, X-Frame-Options, Permissions-Policy, `poweredByHeader: false`, `no-store` on `/api/*`.
- **Rules are tested.** `tests/rules/firestore.rules.test.mjs` covers cross-tenant reads/writes, role escalation and self-registration against the emulator; `scripts/test-rules.mjs` cleans up leftover emulators.
- **Sensible client patterns.** Recharts is behind `next/dynamic` (`dashboard-trend-card.tsx:9`), the payment dialog is lazy (`billing/page.tsx:16`), fonts use `next/font` (`app/layout.tsx:3`), fetch effects in the registration form use an `active` flag (`patient-registration-form.tsx:74-89`), the stock movement read is bounded with `limit(300)` and stock mutations use Firestore transactions (`stock-api.ts:109-114`).
- **Accessibility groundwork.** `ui/form.tsx` wires `id`, `aria-describedby`, `aria-invalid`; required asterisks are `aria-hidden`; rows are keyboard-reachable with Enter/Space and nested action cells stop propagation (`patients-data-table.tsx:83-107`); `aria-busy` marks skeleton regions (44 sites); `<html lang="en">`; muted text passes AA in both themes (5.3:1 to 7.3:1).
- **Dev-only routes are hidden in production** (`src/app/test-shadcn/layout.tsx:4`, `test-tailwind/layout.tsx`) and covered by an e2e check.
- **Unauthenticated login errors do not enumerate.** `auth-errors.ts:9-11` maps `user-not-found`, `wrong-password`, `invalid-credential` to one message; password reset reports success for unknown emails (`auth-services.ts:115-129`).

---

## 🚨 Critical Issues
*Must fix before production: security risks, data loss, broken functionality, or severe performance/cost*

### C1. Every list and detail request reads whole Firestore collections; `limit` and `page` only slice in memory
- **Severity:** Critical
- **Category:** Performance / Firestore cost
- **Location:** `src/app/api/v1/patients/list/route.ts:27` (verified); `src/app/api/v1/medicines/list/route.ts:25`; `src/lib/firebase/firestore-rest.ts:186-201` (`fetchFirestoreCollection`); `src/services/pharmacy-api.ts:68-71` (`listCollection`), `:292-300` (`fetchMedicines`); `src/lib/patients/patient-server.ts:76-79`, `:137-143`
- **Problem:** The patients list route loads the entire `patients` collection (pageSize 300, following `nextPageToken`), filters and sorts in memory, then `paginate()`s. The client asks for `limit: 200`, so the pagination saves no reads, and each committed search or year change repeats the full read. Patient detail reads **all** `feeStructures` and **all** `payments` of the clinic to compute one patient's fee summary. `createPatientRecord` loads every patient only to compute the next roll number. `fetchMedicines({ limit: 100 })` reads every medicine. The `limit` query parameter has no upper bound.
- **Impact:** Reads grow with total collection size on every page view and every search, not with page size. A clinic with 2,000 patients pays 2,000 reads per visit to the patients page, again per search, plus N more on every registration. The test project already exhausted the free daily read quota during automated testing (43k reads in one day).
- **Before (current code):**
  ```ts
  // src/app/api/v1/patients/list/route.ts:27
  let result = await fetchPatientRecords(idToken, businessId)
  if (classId) result = result.filter((s) => s.classId === classId)
  if (status) result = result.filter((s) => s.status === status)
  ...
  const paged = paginate(result, page, limit)
  ```
  ```ts
  // src/lib/patients/patient-server.ts:137
  const [feeStructures, payments] = await Promise.all([
    fetchFirestoreCollection<{ id: string; patientId: string; amount: number }>(`businesses/${businessId}/feeStructures`, idToken),
    fetchFirestoreCollection<Payment>(`businesses/${businessId}/payments`, idToken),
  ])
  ```
- **After (recommended fix):**
  ```ts
  // Real queries with a cap: orderBy + limit + cursor, search on a stored lowercase key.
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 10), 100)
  // patient detail: where('patientId', '==', id) on feeStructures and payments
  const [fees, pays] = await Promise.all([
    runQuery(`businesses/${b}/feeStructures`, { where: ['patientId', '==', id] }, idToken),
    runQuery(`businesses/${b}/payments`, { where: ['patientId', '==', id] }, idToken),
  ])
  // roll numbers: a counter document (transaction) instead of listing all patients
  ```

### C2. Dashboard first load reads six full collections plus stock twice, including a dead legacy `inventory` collection
- **Severity:** Critical
- **Category:** Performance / Firestore cost
- **Location:** `src/services/pharmacy-api.ts:653-664` (`getDashboardStats`, verified); `src/app/(Navigations)/dashboard/page.tsx:53-67`; `src/components/layout/profile-menu.tsx:79-82`
- **Problem:** `getDashboardStats` reads all `patients`, all `medicines` (only `.length` is used), all `payments` (only this month's sum is used), the whole legacy school `inventory` collection (used for an attendance rate that no longer exists), and all `users`. The dashboard effect additionally calls `fetchStockItems()` while the sidebar profile menu dispatches `loadStockData()` (all stock items plus 300 movements) for the same data. The dashboard is the landing page after login, so this is paid on every login and refresh.
- **Impact:** About N + M + P + I + U + S + (S + 300) + 8 reads to render five numbers; `medicines`, `inventory` and the duplicate stock read are pure waste.
- **Before (current code):**
  ```ts
  const [patients, teachers, classes, payments, attendance, activities] = await Promise.all([
    listCollection<Patient>(businessId, 'patients'),
    countTeamMembers(businessId),
    listCollection<Medicine>(businessId, 'medicines'),
    listCollection<Payment>(businessId, 'payments'),
    listCollection<InventoryRecord>(businessId, 'inventory'),
  ```
- **After (recommended fix):**
  ```ts
  import { getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore/lite'
  const [pCount, mCount, feesAgg] = await Promise.all([
    getCountFromServer(query(colRef(b, 'patients'), where('status', '==', 'active'))),
    getCountFromServer(colRef(b, 'medicines')),
    getAggregateFromServer(
      query(colRef(b, 'payments'), where('date', '>=', monthStart), where('date', '<', nextMonthStart)),
      { total: sum('amount') }
    ),
  ])
  // drop the 'inventory' read and the attendance tile; read stock from the Redux store instead of fetching it again
  ```

### C3. Stock is reloaded on every shell mount and every inventory visit, and every mutation reloads all items plus 300 movements
- **Severity:** Critical
- **Category:** Performance / Firestore cost
- **Location:** `src/components/layout/profile-menu.tsx:79-82` (verified); `src/hooks/use-stock-directory.ts:105-108` (verified); `src/redux/slices/stockSlice.ts:49-52`, `:62-70` (`loadAll`, `mutationThunk`, verified)
- **Problem:** The profile menu in the always-mounted sidebar dispatches `loadStockData()` once per full page load (for the alert badge); the inventory page dispatches it again on mount with no freshness check. `mutationThunk` runs the mutation and then calls `loadAll()` (all items plus `limit(300)` movements) even though the transaction already knows what changed. The badge needs no movements at all.
- **Impact:** S + 300 reads per page visit and per add/receive/adjust; one "receive stock" click costs 300+S reads.
- **Before (current code):**
  ```ts
  async function loadAll() {
    const [items, movements] = await Promise.all([fetchStockItems(), fetchStockMovements()])
    return { items, movements }
  }
  // mutationThunk:
  await run(arg)
  return await loadAll()
  ```
- **After (recommended fix):**
  ```ts
  // Separate thunks: loadStockItems (badge, dashboard) and loadStockMovements (only when the Movements tab opens).
  // Skip the refetch when state is fresh:
  createAsyncThunk('stock/load', fn, {
    condition: (_, { getState }) => Date.now() - (getState() as RootState).stock.lastLoadedAt > 60_000,
  })
  // After a mutation, patch the returned item into state and prepend the new movement instead of reloading everything.
  ```

### C4. The global flag taxonomy is writable by any tenant's `super_admin`, and owner registration is open by default
- **Severity:** Critical
- **Category:** Security / multi-tenant isolation
- **Location:** `firestore.rules:94-102` (verified); `src/app/api/v1/flag-categories/**` (all mutating handlers); `src/app/api/auth/register/route.ts:31`; `src/components/forms/login-form.tsx:47`
- **Problem:** `flagCategories` is a shared collection with no `businessId`, and its rules allow writes to any active `super_admin`. Anyone can become a `super_admin` of a brand-new tenant through `POST /api/auth/register`, which is open unless `NEXT_PUBLIC_ALLOW_REGISTRATION` is exactly `'false'`. The path was traced: register creates `users/{uid}` with `role: super_admin`, `isSuperAdmin()` becomes true, and the rule allows writes to `/flagCategories/**`. `CLAUDE.md` lists this as known debt (plan S3); it remains a cross-tenant integrity break in a product built as multi-tenant.
- **Impact:** One malicious or careless account can rename, delete or poison the potency, form and symptom flags that every other clinic's medicines and diseases reference by value, with no server-side audit trail. The risk drops to near zero only if the deployment is single-tenant and registration is closed after the owner exists.
- **Before (current code):**
  ```
  match /flagCategories/{categoryId} {
    allow read: if isActiveUser();
    allow write: if isSuperAdmin();

    match /flags/{flagId} {
      allow read: if isActiveUser();
      allow write: if isSuperAdmin();
    }
  }
  ```
- **After (recommended fix):**
  ```
  // Preferred: per-tenant taxonomy under businesses/{b}/flagCategories/** written by isBusinessAdmin(b).
  // Interim: only a platform operator may write the global taxonomy.
  match /flagCategories/{categoryId} {
    allow read: if isActiveUser();
    allow write: if isSuperAdmin() && request.auth.token.get('platformAdmin', false) == true;
    match /flags/{flagId} {
      allow read: if isActiveUser();
      allow write: if isSuperAdmin() && request.auth.token.get('platformAdmin', false) == true;
    }
  }
  // Set once for the operator: adminAuth.setCustomUserClaims(uid, { platformAdmin: true }); and close registration (W4).
  ```

---

## ⚠️ Warnings
*Should fix soon: maintainability risks, performance degradation, or code smell*

### W1. No `global-error.tsx` and no segment error boundary under `(Navigations)`
- **Severity:** Warning
- **Category:** Error handling / resilience
- **Location:** `src/app/error.tsx:1` is the only boundary; `src/app/global-error.tsx` and `src/app/(Navigations)/error.tsx` do not exist (verified)
- **Problem:** `error.tsx` at the root renders inside `src/app/layout.tsx`, so it cannot catch errors from the root layout or its providers (`ReduxProvider`, `ThemeProvider`, `ToastProvider`, `OfflineOverlay`, `layout.tsx:41-52`). Without `global-error.tsx`, Next shows its own plain fallback ("Application error: a client-side exception has occurred", which was seen during setup) with no recovery action. Because there is no `(Navigations)/error.tsx`, any page crash replaces the whole screen, sidebar included, with the root error page. (An earlier draft of this review rated this Critical and described a blank page; the default fallback is not blank, so it is a Warning.)
- **Impact:** A provider or init failure leaves users with an unactionable message; page-level crashes lose navigation; no telemetry beyond `console.error` (`error.tsx:15-17`).
- **Before (current code):**
  ```tsx
  // src/app/error.tsx:14-17
  export default function Error({ error, reset }: ErrorProps) {
    const router = useRouter()
    useEffect(() => {
      console.error(error)
  ```
- **After (recommended fix):**
  ```tsx
  // src/app/global-error.tsx
  'use client'
  export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
      <html lang="en"><body>
        <h1>Something went wrong</h1>
        <button onClick={() => reset()}>Try again</button>
        <a href="/">Back to sign in</a>
      </body></html>
    )
  }
  // plus src/app/(Navigations)/error.tsx so the shell stays and only the content area shows the error
  ```

### W2. No `loading.tsx` or Suspense anywhere; every route is a client component
- **Severity:** Warning
- **Category:** Rendering / data fetching
- **Location:** `src/app/(Navigations)/` (no `loading.tsx`); `grep Suspense src` returns 0 matches (verified); `'use client'` at line 1 of `src/app/(Navigations)/layout.tsx`, `src/app/(auth)/layout.tsx` and all 17 `(Navigations)/**/page.tsx`
- **Problem:** Each route is a client component whose first act is a `useEffect` fetch. Static hero text ships inside the client bundle, the protected layout redirects in an effect after hydration, and nothing streams. Fetches start only after JS load, hydration, auth resolution and token retrieval (a four-step waterfall). Skeleton-first rendering exists inside pages (a deliberate trade-off recorded in `CLAUDE.md`), but only starts after the chunk loads. `useSearchParams` in `patients/[id]/page.tsx:60` has no Suspense boundary.
- **Impact:** Perceived lag on every first visit to a route; larger first-load JS per route; no instant prefetchable fallback.
- **Before (current code):**
  ```tsx
  'use client'

  import { useEffect, useRef } from 'react'
  import { usePathname, useRouter } from 'next/navigation'
  ```
- **After (recommended fix):**
  ```tsx
  // src/app/(Navigations)/loading.tsx
  import { PageSkeleton } from '@/components/shared/page-skeleton'
  export default function Loading() { return <PageSkeleton /> }

  // page.tsx (server): static hero + island for the data
  export default function Page() {
    return (<><PageHero ... /><Suspense fallback={<TableSkeleton />}><PatientsDirectory /></Suspense></>)
  }
  ```

### W3. Open redirect after login: `/\evil.com` passes the `?redirect=` check
- **Severity:** Warning
- **Category:** Security / open redirect
- **Location:** `src/components/forms/login-form.tsx:78-82` (`onSubmit`, verified)
- **Problem:** The guard accepts any value that starts with `/` and not `//`. Browsers treat `\` as `/` in http(s) URLs, so `/\evil.com` resolves to `//evil.com` and navigates off-site. The middleware only writes a clean `pathname` into `redirect` (`middleware.ts:23`), but an attacker can craft the login URL by hand.
- **Impact:** Phishing: a victim who logs in through a crafted link lands on an attacker-controlled page that looks like a post-login screen.
- **Before (current code):**
  ```ts
  const requested = new URLSearchParams(window.location.search).get('redirect')
  // Only follow same-origin relative paths (blocks open redirects like //evil.com).
  const safeRedirect =
    requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : null
  window.location.assign(safeRedirect ?? ROUTES.dashboard)
  ```
- **After (recommended fix):**
  ```ts
  function safeRedirectTarget(requested: string | null): string | null {
    if (!requested) return null
    try {
      const url = new URL(requested, window.location.origin)
      return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null
    } catch {
      return null
    }
  }
  window.location.assign(safeRedirectTarget(requested) ?? ROUTES.dashboard)
  ```

### W4. Owner registration fails open and its switch is a build-time public variable
- **Severity:** Warning
- **Category:** Security / configuration
- **Location:** `src/app/api/auth/register/route.ts:31`; `src/middleware.ts:12`; `src/components/forms/login-form.tsx:47`
- **Problem:** All three gates read `NEXT_PUBLIC_ALLOW_REGISTRATION`; unset means open. `NEXT_PUBLIC_*` values are inlined at build time, including in server code, so changing the Vercel variable does nothing until a redeploy. A forgotten variable leaves an unauthenticated endpoint that mints `super_admin` tenants (see C4).
- **Impact:** An operator who flips the variable but does not redeploy believes registration is closed when it is not.
- **Before (current code):**
  ```ts
  export async function POST(request: NextRequest) {
    if (process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'false') {
      return NextResponse.json({ success: false, message: 'Registration is closed' }, { status: 403 })
    }
  ```
- **After (recommended fix):**
  ```ts
  // Server-only, read at runtime, fail closed:
  if (process.env.ALLOW_REGISTRATION !== 'true') {
    return NextResponse.json({ success: false, message: 'Registration is closed' }, { status: 403 })
  }
  // keep NEXT_PUBLIC_ALLOW_REGISTRATION only to hide the link in the UI
  ```

### W5. No effective rate limiting on auth endpoints; the register throttle is per instance and the 409 enumerates accounts
- **Severity:** Warning
- **Category:** Security / abuse protection
- **Location:** `src/app/api/auth/register/route.ts:14-28`, `:35`, `:106-110` (verified); `src/app/api/auth/session/route.ts` and `src/app/api/admin/users/route.ts` (no limiter)
- **Problem:** The only limiter is a module-level `Map`; on Vercel each warm instance has its own copy, cold starts reset it, and entries are never evicted so it also grows without bound. Registration answers `409 An account with this email already exists`, confirming registered emails to anonymous callers (login is careful not to).
- **Impact:** Anyone can script account creation (each call creates an Auth user, a profile and a business document) and probe email existence, costing quota and writes.
- **Before (current code):**
  ```ts
  // Best-effort per-instance throttle (serverless instances are short-lived; this only slows bursts).
  const attempts = new Map<string, { count: number; resetAt: number }>()
  const WINDOW_MS = 10 * 60 * 1000
  const MAX_ATTEMPTS = 5
  ```
- **After (recommended fix):**
  ```ts
  // Shared store (e.g. Upstash Redis) or a Vercel Firewall rate-limit rule on /api/auth/*.
  const limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, '10 m') })
  const { success } = await limiter.limit(`register:${ip}`)
  if (!success) return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 })
  // and return one generic message for an existing email, or require email verification first
  ```

### W6. `POST /api/admin/users`: ad hoc validation, raw `error.message` returned, wrong status for auth failures
- **Severity:** Warning
- **Category:** API validation / error handling
- **Location:** `src/app/api/admin/users/route.ts:7-12`, `:26-49`, `:85-88`
- **Problem:** The body is cast with `as` and not validated; `body.name?.trim()` throws a `TypeError` for non-string input; name length and email format are unchecked (the sibling `PATCH` enforces 2-100 characters). The catch-all returns `error.message` with status 400, so an expired session cookie returns Firebase's "Decoding Firebase session cookie failed" text as a 400, not a 401, and internal text leaks. The handler also re-implements the session check instead of using `requireApiSession`.
- **Impact:** Inconsistent status codes break client handling; internal error text leaks; unchecked field lengths are stored.
- **Before (current code):**
  ```ts
  const body = (await request.json()) as { name?: string; email?: string; password?: string; role?: UserRole }
  if (!body.name?.trim() || !body.email?.trim() || !body.password || !body.role) {
  ...
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
  ```
- **After (recommended fix):**
  ```ts
  const CreateUser = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
    role: z.enum(['staff', 'super_admin']),
  })
  const parsed = CreateUser.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  ...
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    if ((error as { code?: string }).code === 'auth/email-already-exists')
      return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 })
    console.error('[POST /api/admin/users]', error)
    return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 })
  }
  ```

### W7. `/api/v1` flag routes return raw upstream error text to the client
- **Severity:** Warning
- **Category:** Information disclosure
- **Location:** `src/app/api/v1/flag-categories/[categoryId]/route.ts:25-28`; `.../flags/route.ts:58-61`; `.../flags/[flagId]/route.ts:27-30`, `:45-48`; `src/lib/firebase/firestore-rest.ts:96`, `:131`, `:151`
- **Problem:** `firestore-rest.ts` throws `new Error(body.error?.message ?? ...)` with Google's raw message ("Missing or insufficient permissions.", "Firebase project ID is not configured"). These routes return `error.message` with status 400 for any error type. The patient and disease routes use fixed strings, so behaviour is inconsistent.
- **Impact:** Deployment details and Firestore internals reach the browser; a rules denial looks like a validation 400 and a server misconfiguration is hidden.
- **Before (current code):**
  ```ts
  console.error('[PUT /api/v1/flag-categories/:id]', error)
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Failed to update category' },
    { status: 400 }
  )
  ```
- **After (recommended fix):**
  ```ts
  class DomainError extends Error { constructor(msg: string, public status = 400) { super(msg) } }
  ...
  if (error instanceof DomainError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('[PUT /api/v1/flag-categories/:id]', error)
  return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  ```

### W8. `PUT /api/v1/patients/[id]` is a mass-assignment endpoint with unescaped Firestore field paths
- **Severity:** Warning
- **Category:** Input validation
- **Location:** `src/app/api/v1/patients/[id]/route.ts:37-44`; `src/lib/patients/patient-profile-detail.ts:568-575` (verified); `src/lib/patients/patient-server.ts:174-188`; `src/lib/firebase/firestore-rest.ts:177-183`
- **Problem:** Every key of the request body other than a few envelope names is copied into the update, with no check of type, length or allowed keys. A staff caller can set `createdAt`, an arbitrary `rollNumber` (bypassing the `rollNumbers` uniqueness reservation made at creation), or any extra field. `patchFirestoreDocument` then places each key unescaped into `updateMask.fieldPaths=${path}`, so a key containing `&`, `.`, `#` or a backtick breaks the query string. The blast radius is the caller's own tenant, because the call carries the user's token.
- **Impact:** Duplicate or forged patient IDs, corrupted records, and malformed keys that produce 400s that look like server errors.
- **Before (current code):**
  ```ts
  const flatFields: Record<string, unknown> = { ...record }
  for (const key of ['data', 'header', 'Overview', 'Academic', 'Attendance', 'Prescriptions', 'Fees']) {
    delete flatFields[key]
  }
  if (Object.keys(flatFields).length > 0) {
    update = { ...update, ...(flatFields as PatientUpdateInput) }
  }
  ```
  ```ts
  const query = fieldPaths.length > 0
    ? `?${fieldPaths.map((path) => `updateMask.fieldPaths=${path}`).join('&')}`
    : ''
  ```
- **After (recommended fix):**
  ```ts
  const PatientUpdate = z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().max(20).optional(),
    // every editable field listed explicitly; omit id, createdAt, rollNumber
  }).strict()
  const updateInput = PatientUpdate.parse(extractedFields)

  // firestore-rest.ts
  `updateMask.fieldPaths=${encodeURIComponent('`' + path.replace(/`/g, '\\`') + '`')}`
  ```

### W9. API request bodies are cast, not validated; Zod is used only in forms
- **Severity:** Warning
- **Category:** TypeScript / validation boundary
- **Location:** `src/app/api/v1/diseases/route.ts:25`, `diseases/[id]/route.ts:34`, `flag-categories/[categoryId]/flags/route.ts:29`, `.../flags/[flagId]/route.ts:13`, `patients/route.ts:13`, `patients/[id]/route.ts:37`
- **Problem:** `(await request.json()) as DiseaseCreateInput` asserts a shape the compiler cannot check. `zod` is imported in only 5 files (login form, register form, one dialog, two schemas) and in no API route. Handlers call `body.name?.trim()`, and `normalizePatientCreateInput` (`src/lib/patients/patient-create-input.ts:14-45`) calls `.map` on whatever arrives, so a string where an array is expected throws a 500 instead of a 400. The browser schema is not reused server-side.
- **Impact:** Malformed or hostile JSON gives 500s; the Firestore rules end up as the only real validator.
- **Before (current code):**
  ```ts
  const body = (await request.json()) as DiseaseCreateInput
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Disease name is required' }, { status: 400 })
  }
  ```
- **After (recommended fix):**
  ```ts
  const diseaseCreateSchema = z.object({ name: z.string().trim().min(1).max(120), symptoms: z.array(z.string()).optional() })
  const parsed = diseaseCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 })
  // export the schema from src/lib/** and derive types with z.infer
  ```

### W10. CSP allows `'unsafe-inline'` scripts and several broad sources
- **Severity:** Warning
- **Category:** Security headers
- **Location:** `next.config.ts:12-13`, `:14`, `:18`, `:25`
- **Problem:** `script-src 'self' 'unsafe-inline'` in production means any injected inline script runs, so the CSP gives little XSS protection (a documented trade-off, since Next's inline bootstrap needs a nonce otherwise). `https://apis.google.com` in `script-src` is a known allowlist-bypass host; `connect-src https://*.googleapis.com` permits any Google API endpoint as an exfiltration channel; `img-src ... https:` allows images from anywhere. Firebase client auth keeps ID and refresh tokens in IndexedDB, so a successful XSS can read them regardless of the `HttpOnly` cookie. No `dangerouslySetInnerHTML` use exists in `src`. `CLAUDE.md` says Firebase Auth needs `apis.google.com`; this was not verified for the email/password-only flow, so test removing it.
- **Impact:** The CSP is a defence-in-depth layer that is currently weak against injected script and data exfiltration.
- **Before (current code):**
  ```ts
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://va.vercel-scripts.com https://apis.google.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  'https://*.googleapis.com',
  ```
- **After (recommended fix):**
  ```ts
  // middleware.ts: per-request nonce + 'strict-dynamic'
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; ...
    connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com;
    img-src 'self' data: blob:`
  ```

### W11. Firestore rules accept any shape for payments, patients and admin collections
- **Severity:** Warning
- **Category:** Security / data integrity
- **Location:** `firestore.rules:115-121`, `:125-131`; tests `tests/rules/firestore.rules.test.mjs:144-146`, `:167`
- **Problem:** `payments` create is open to any staff member with no field validation (the test writes `{ any: 'shape' }`), so a staff member can create a payment with a negative or enormous amount or any `patientId`; `buildFeeSummary` sums these amounts (`patient-server.ts:29-31`), so a forged payment shifts balances. `patients` create and update accept any shape, including overwriting `rollNumber` and `createdAt`. The stock and movement rules do validate, which shows the intended standard.
- **Impact:** The rules guard tenancy and roles but not data integrity; a careless or compromised staff account can corrupt financial records.
- **Before (current code):**
  ```
  match /payments/{id} {
    allow read, create: if isMember(businessId);
    allow update, delete: if isBusinessAdmin(businessId);
  }
  ```
- **After (recommended fix):**
  ```
  function validPayment(d) {
    return d.amount is number && d.amount > 0 && d.amount <= 10000000 &&
      shortString(d.patientId, 100) && d.date is string && d.date.size() <= 40 &&
      optionalString(d, 'note', 500);
  }
  match /payments/{id} {
    allow read: if isMember(businessId);
    allow create: if isMember(businessId) && validPayment(request.resource.data);
    allow update, delete: if isBusinessAdmin(businessId);
  }
  // add validPatient() with types, max lengths and immutable rollNumber/createdAt on update
  ```

### W12. Two rules let staff delete records, contradicting the stated policy, and neither is tested
- **Severity:** Warning
- **Category:** Authorization / rules drift
- **Location:** `firestore.rules:137-139`, `:150-152` (verified); the comment at `:123-124` says deletes are admin-only
- **Problem:** `prescriptionItems` and `inventory` use `allow read, write: if isMember(...)`, and `write` includes `delete`. The tests check only a `setDoc` for `prescriptionItems` and nothing for `inventory`. `staff` and `classes` in the wildcard collection list are legacy names that remain admin-writable and untested.
- **Impact:** A staff member can delete every `prescriptionItems` and `inventory` record in the tenant, and the test suite would not notice if this changed.
- **Before (current code):**
  ```
  match /prescriptionItems/{id} {
    allow read, write: if isMember(businessId);
  }
  match /inventory/{id} {
    allow read, write: if isMember(businessId);
  }
  ```
- **After (recommended fix):**
  ```
  match /prescriptionItems/{id} {
    allow read, create, update: if isMember(businessId);
    allow delete: if isBusinessAdmin(businessId);
  }
  // inventory: delete the match block (legacy, dead code) or apply the same split.
  // Add tests: staff cannot delete prescriptionItems; inventory is denied or admin-only.
  ```

### W13. The stock ledger is not bound to stock changes in the rules
- **Severity:** Warning
- **Category:** Authorization / audit integrity
- **Location:** `firestore.rules:155-189`
- **Problem:** `stockItems` writes validate types and ranges; `stockMovements` creates validate shape and `performedById`. Nothing ties the two together. A staff member can set `totalQuantity` on a stock item through the Firestore API and write no movement, or write a movement whose `balanceAfter` does not match the item. The "immutable ledger" proves nothing was edited, not that every change was recorded.
- **Impact:** Stock can be reduced without a trace, which matters for a pharmacy audit trail.
- **Before (current code):**
  ```
  allow read: if isMember(businessId);
  allow create, update: if isMember(businessId) && validItem(request.resource.data);
  allow delete: if isBusinessAdmin(businessId) && resource.data.totalQuantity == 0;
  ```
- **After (recommended fix):**
  ```
  // Require a paired movement written in the same batch/transaction (store lastMovementId on the item):
  allow update: if isMember(businessId) && validItem(request.resource.data) &&
    (request.resource.data.totalQuantity == resource.data.totalQuantity ||
     getAfter(/databases/$(database)/documents/businesses/$(businessId)/stockMovements/$(request.resource.data.lastMovementId))
       .data.balanceAfter == request.resource.data.totalQuantity);
  // or move stock mutations to a trusted server route
  ```

### W14. `fetchFirestoreDocument` swallows every error, so outages look like 401 or 404; REST calls have no timeout
- **Severity:** Warning
- **Category:** Error handling / robustness
- **Location:** `src/lib/firebase/firestore-rest.ts:203-214` (verified); consumers `:252-259` and `src/lib/api/require-api-id-token.ts:80-83`; no fetch timeout at `:82`, `:114`, `:143`
- **Problem:** The `catch {}` returns `null` for permission-denied, 5xx and network failures alike. `loadProfile` treats `null` as "no profile" and throws a 401, which the client interprets as an invalid session. A transient Firestore error therefore signs the user out in the UI, and patient or medicine fetches return a wrong 404. None of the REST calls sets a timeout, so a hung upstream occupies the function until the 30 s `maxDuration` in `vercel.json`.
- **Impact:** Spurious sign-outs and wrong 404s during incidents, and harder debugging.
- **Before (current code):**
  ```ts
  try {
    const body = await firestoreFetch(documentPath, idToken)
    if (!body.name || !body.fields) return null
    return decodeFirestoreDocument({ name: body.name, fields: body.fields }) as T
  } catch {
    return null
  }
  ```
- **After (recommended fix):**
  ```ts
  class FirestoreHttpError extends Error { constructor(public status: number, msg: string) { super(msg) } }
  // firestoreFetch: throw new FirestoreHttpError(res.status, ...); fetch(url, { signal: AbortSignal.timeout(8000) })
  try { ... } catch (e) {
    if (e instanceof FirestoreHttpError && e.status === 404) return null
    throw e   // 403/5xx/timeout surface as 403/502, not "not found"
  }
  ```

### W15. The patient list endpoint returns Aadhaar numbers and parent details in full
- **Severity:** Warning
- **Category:** Privacy / data minimisation
- **Location:** `src/app/api/v1/patients/list/route.ts:37-39`; `src/lib/patients/patient-create-input.ts:60-67`; `src/lib/patients/patient-profile-detail.ts:44`
- **Problem:** The list route returns whole `Patient` documents per row, including `parents.fatherAadhar`, `motherAadhar` and `aadharNumber` where present, plus phone, address and guardian data, while the list view needs a few columns. Aadhaar numbers are stored unmasked in Firestore documents readable by every active staff member of the tenant. This is a data-minimisation recommendation, not a legal conclusion: storage and display of Aadhaar numbers is regulated in India, so have counsel confirm requirements.
- **Impact:** A larger blast radius if a staff account or an XSS event exposes the list response, and more sensitive data in client memory and browser caches than the UI needs.
- **Before (current code):**
  ```ts
  const paged = paginate(result, page, limit)
  const response: PaginatedResponse<Patient> = {
    data: paged.data,
  ```
- **After (recommended fix):**
  ```ts
  const toListRow = ({ id, rollNumber, firstName, lastName, phone, status, createdAt, className }: Patient) =>
    ({ id, rollNumber, firstName, lastName, phone, status, createdAt, className })
  data: paged.data.map(toListRow)
  // serve Aadhaar only on the detail route, masked (XXXX-XXXX-1234) unless the role needs it
  ```

### W16. The flag taxonomy is re-fetched on every page mount and not shared between hooks
- **Severity:** Warning
- **Category:** Data fetching / dedup
- **Location:** `src/hooks/use-medicine-flag-options.ts:20-47`, `src/hooks/use-disease-flag-options.ts:14-31`, `src/lib/flags/flag-server.ts:128-137`, `src/services/flag-api.ts:32-35`
- **Problem:** `fetchAllFlagDetails` lists the categories and then one `flags` subcollection per category; each page that uses the hook repeats it and keeps the result in local state. The flags are global, rarely changing reference data with no cache, no Redux entry and no HTTP caching (`patient-api.ts` uses `cache: 'no-store'`).
- **Impact:** (1 + C + all flags) reads on every visit to the medicine, disease and new-patient pages for the same data.
- **Before (current code):**
  ```ts
  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const categoriesWithFlags = await fetchAllFlagDetails()
  ```
- **After (recommended fix):**
  ```ts
  let cache: { at: number; p: Promise<FlagCategoryWithFlags[]> } | null = null
  export function fetchAllFlagDetailsCached(ttl = 10 * 60_000) {
    if (!cache || Date.now() - cache.at > ttl) cache = { at: Date.now(), p: fetchAllFlagDetails() }
    return cache.p
  }
  // set cache = null in the create/update/delete flag mutations
  ```

### W17. Patient registration and detail pull all medicines and diseases just to fill dropdowns, sometimes twice
- **Severity:** Warning
- **Category:** Data fetching / over-fetching
- **Location:** `src/components/patients/patient-registration-form.tsx:74-89`, `:91-100`; `src/app/(Navigations)/patients/[id]/page.tsx:82-86`; `src/redux/slices/patientSlice.ts:32-40`
- **Problem:** The form's effects call `fetchMedicines({ limit: 100 })` (a whole-collection read, see C1) and `fetchDiseases()`. The detail page additionally dispatches `fetchPatientMedicines()` into Redux while the form fetches medicines itself, so the same collection can be read twice on one screen, and results are never reused across pages.
- **Impact:** M + D (+ M again) reads per new or edit patient screen.
- **Before (current code):**
  ```ts
  useEffect(() => {
    let active = true
    fetchMedicines({ limit: 100 })
      .then((res) => {
  ```
- **After (recommended fix):**
  ```ts
  // One shared cached "reference data" loader (medicine and disease names) in a slice with loadedAt,
  // consumed by both the form and the detail page; or a lightweight options document maintained on write.
  ```

### W18. Billing recomputes per-patient sums with O(patients x payments) filters and re-reads three collections on every filter toggle
- **Severity:** Warning
- **Category:** Data fetching / performance
- **Location:** `src/services/pharmacy-api.ts:556-585` (`fetchPatientFeeSummaries`); `src/hooks/use-billing-page.ts:41-46`, `:81-94`
- **Problem:** The service reads all patients, feeStructures and payments, then for each patient runs two to three array filters (N x (F + 2P)). `overdueOnly` is a dependency of `loadSummaries`, so toggling the filter re-reads all three collections although it is a pure client filter.
- **Impact:** N + F + P reads on each visit and on each toggle, with CPU growing quadratically with clinic size.
- **Before (current code):**
  ```ts
  const loadSummaries = useCallback(async () => {
    const data = await fetchPatientFeeSummaries(overdueOnly)
    setSummaries(data)
    return data
  }, [overdueOnly])
  ```
- **After (recommended fix):**
  ```ts
  const visible = useMemo(
    () => (overdueOnly ? summaries.filter((s) => s.isOverdue && s.balance > 0) : summaries),
    [summaries, overdueOnly]
  )
  // service: group once with a Map keyed by patientId (O(N + P)); longer term keep totalPaid/totalDue on the patient doc
  ```

### W19. Fetch effects in the directory hooks have no abort guard, and several effects only derive state
- **Severity:** Warning
- **Category:** React hooks
- **Location:** `src/hooks/use-patients-directory.ts:84-88`, `use-medicines-directory.ts:79-82`, `use-diseases-directory.ts:64-66`, `use-billing-page.ts:41-46`, `src/app/(Navigations)/dashboard/page.tsx:49-67`; derived-state effects at `use-billing-page.ts:74-80`, `use-stock-directory.ts:165-167`
- **Problem:** `load` writes state after `await` with no cancelled flag or `AbortController`, so a slow earlier request (an old search term) can resolve after a newer one and overwrite the list. `useEffect(() => setPage(1), [search, overdueOnly])` adds a render after each change; the reset belongs in the setter that changes the filter.
- **Impact:** A stale-response race on search and filters, plus extra renders.
- **Before (current code):**
  ```ts
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPatientsList({ page: 1, limit: 200, search: filters.search.trim() || undefined,
  ```
- **After (recommended fix):**
  ```ts
  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    const ac = new AbortController()
    load(ac.signal)            // pass the signal to fetch(); ignore AbortError; skip setState if aborted
    return () => ac.abort()
  }, [load, authLoading, isAuthenticated])
  ```

### W20. Pages import from the `@/components/shared` barrel, which re-exports about 25 client modules
- **Severity:** Warning
- **Category:** Bundle / barrel imports
- **Location:** `src/components/shared/index.tsx:1-40`; imports at `src/app/(Navigations)/billing/page.tsx:6`, `dashboard/page.tsx:12`, `patients/page.tsx:6`, `vault/medicine/page.tsx:19`, `components/billing/billing-categories-panel.tsx:5`
- **Problem:** `CLAUDE.md` forbids barrel imports in layouts and shared components because they once pulled ECharts and Recharts into every page, yet pages import `BentoGrid`/`BentoCard`/`FilterToolbar` from the `shared` barrel, which also re-exports `AdvancedTimeSelect` (374 lines), phone and Aadhaar inputs, `DataTable` and more. Nothing enforces the rule, and `export *` in `src/components/index.ts` re-exports all of `ui`. One stray `from '@/components'` import (already present in the dev-only `test-shadcn/page.tsx:49`) pulls every Radix primitive.
- **Impact:** A risk of loading unrelated input widgets on pages that only need a grid wrapper, and an easy regression of the bundle size the team already fought for.
- **Before (current code):**
  ```ts
  import { BentoGrid, BentoCard } from '@/components/shared'
  ```
- **After (recommended fix):**
  ```ts
  import { BentoGrid } from '@/components/shared/bento-grid'
  import { BentoCard } from '@/components/shared/bento-card'
  // eslint.config.mjs: enforce it
  { rules: { 'no-restricted-imports': ['error', { patterns: ['@/components', '@/hooks', '@/components/ui'] }] } }
  ```

### W21. Dead and foreign code is shipped: test routes, 45 unused UI files, about 12 packages, legacy API functions, mock notifications
- **Severity:** Warning
- **Category:** Dead code / dependency health
- **Location:** `src/app/test-shadcn/page.tsx:49`, `src/app/test-tailwind/page.tsx`; `src/components/ui/{sidebar,carousel,input-otp,resizable,drawer,accordion,menubar,image-slider,...}.tsx` (0 importers each for the 8 sampled files, verified; the agent counted 45 in total); `package.json:54-71`; `src/services/pharmacy-api.ts:402-470`, `:517-575`; `src/context/NotificationContext.tsx:36-78`; `scripts/create-env-production.sh`
- **Problem:** The dev-only test pages are hidden by `notFound()` but still compiled and listed as routes. 45 files in `src/components/ui` have no importers, including the 773-line `sidebar.tsx` (replaced by `layout/admin-sidebar.tsx`) and 455-line `image-slider.tsx`; the packages reached only through them (`embla-carousel-react`, `input-otp`, `vaul`, `react-resizable-panels`, and several `@radix-ui/*`) stay in `package.json`. `pharmacy-api.ts` still holds exam, attendance and inventory functions that read legacy collections. `NotificationContext.tsx` ships mock data from another product ("New order #FAMORD...", "Green Tea (5 left)"), its provider is mounted nowhere, and its bell is only referenced by a barrel. `create-env-*.sh` says "FAM Portal" and is bash-only.
- **Impact:** A larger install and audit surface (each package is supply-chain exposure), dead reads (see C2), and confusion about which component is canonical.
- **Before (current code):**
  ```json
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.4.2",
  "vaul": "^1.1.2",
  "react-resizable-panels": "^3.0.4",
  ```
  ```ts
  // src/context/NotificationContext.tsx:36
  // Mock initial notifications
  const initialNotifications: Notification[] = [
    { id: '1', message: 'New order #FAMORD2025090159 received', ...
  ```
- **After (recommended fix):**
  ```text
  Delete the unreferenced ui/* wrappers, src/app/test-shadcn, src/app/test-tailwind, NotificationContext + notification-bell,
  the legacy functions in pharmacy-api.ts and the FAM scripts; then `npm uninstall` the orphaned packages.
  Confirm with `npx knip` before removing anything.
  ```

### W22. Filters, search and paging are component state, not URL state; two different caching models coexist
- **Severity:** Warning
- **Category:** State management
- **Location:** `src/hooks/use-patients-directory.ts:55-64`, `use-medicines-directory.ts`, `use-diseases-directory.ts:42-49`, `use-billing-page.ts:9-20`, `src/redux/slices/stockSlice.ts`
- **Problem:** Search, status, year, sort and page for patients, medicines, diseases, billing and inventory live in `useState`, so refresh, the back button and shared links lose them (only `patients/[id]/page.tsx:60` uses `useSearchParams`, for a tab). Stock is the only list in Redux, while the others are local state, and each hook hand-rolls `loading/error/reload`.
- **Impact:** Lost view state on navigation, duplicate fetches and inconsistent patterns.
- **Before (current code):**
  ```ts
  const [filters, setFilters] = useState<PatientDirectoryFilters>(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [sortField, setSortField] = useState<PatientSortField>('createdAt')
  const [page, setPage] = useState(1)
  ```
- **After (recommended fix):**
  ```ts
  const sp = useSearchParams(); const router = useRouter()
  const q = sp.get('q') ?? ''; const page = Number(sp.get('page') ?? 1)
  const setParam = (k: string, v?: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); router.replace(`?${n}`, { scroll: false }) }
  // and move server data to RTK Query or SWR with a keepUnusedDataFor window
  ```

### W23. CI never runs the Playwright suite, and there are no unit or component tests
- **Severity:** Warning
- **Category:** Testing
- **Location:** `.github/workflows/ci.yml:33-47`; `tests/e2e/*` (4 files); `tests/**/*` is excluded in `tsconfig.json:73`
- **Problem:** The only automated checks in CI are typecheck, lint, the rules tests, two verification scripts and the build. Playwright (46 tests) runs only by hand. Not covered anywhere: the billing payment dialog, staff-role UI gating, owner registration, patient create and edit, vault CRUD, settings user management, and any authenticated `/api/v1/*` or `/api/admin/*` call. There is no Vitest or Jest, so `stock-utils.ts`, `stock-stats.ts`, `permissions.ts` and the FEFO adjust in `stock-api.ts` have no unit tests (`stock.spec.ts:7-8` admits expired-batch logic is untested). Test code is never type-checked.
- **Impact:** Regressions in payment, permission and expiry logic are caught only by hand.
- **Before (current code):**
  ```yaml
  - name: Unit verification scripts
    run: |
      npx tsx scripts/verify-patient-roll-number.ts
      npx tsx scripts/verify-registration-payload.ts
  - name: Production build
    run: npm run build
  ```
- **After (recommended fix):**
  ```yaml
  - name: E2E (test project)
    run: npx playwright install --with-deps chromium && PLAYWRIGHT_START_SERVER=1 E2E_PROD=1 npx playwright test
    env: { TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}, TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }} }
  # run it nightly or on main only, to protect the test project's read quota;
  # add Vitest for src/lib/stock-*.ts and permissions.ts; add a staff-user storageState project
  ```

### W24. `deploy-rules.yml` publishes Firestore rules without running the rules tests itself
- **Severity:** Warning
- **Category:** DevOps
- **Location:** `.github/workflows/deploy-rules.yml:3-12`, `:20-48`
- **Problem:** The comment says the `verify` job "must have passed before the PR was merged", but the workflow has no `needs`, no `workflow_run` and runs no tests. It is safe only through branch protection, which is configured in GitHub (the `main` ruleset requires a PR and `verify`), not in the repo, and `dev` is unprotected: a direct push to `dev` with a broken `firestore.rules` is published to the test project immediately.
- **Impact:** A security-rules regression can reach a Firebase project unchecked if branch protection is ever relaxed.
- **Before (current code):**
  ```yaml
  steps:
    - uses: actions/checkout@v4
    ...
    - run: npm ci --legacy-peer-deps
    - name: Publish rules
      if: env.FIREBASE_SERVICE_ACCOUNT != ''
      run: npx tsx scripts/deploy-firestore-rules.ts --project "$PROJECT_ID"
  ```
- **After (recommended fix):**
  ```yaml
  - uses: actions/setup-java@v4
    with: { distribution: temurin, java-version: 21 }
  - run: npm run test:rules          # gate the publish on the rules tests
  # and use a GitHub "production" environment with required reviewers for main
  ```

### W25. The primary button and the page badge fail WCAG contrast
- **Severity:** Warning
- **Category:** Accessibility / colour contrast
- **Location:** `src/styles/globals.css:6451-6456` (`.page-hero-primary`) and `.page-hero-badge`; token `--metric-classes` at `src/styles/globals.css:51`; `heroPrimaryClass` at `src/components/shared/page-hero.tsx:25`
- **Problem:** The primary button is `color: hsl(0 0% 100%)` on `hsl(160 84% 39%)`, which computes to 2.59:1 (AA needs 4.5:1 for the 12px button text). The page badge uses amber `hsl(38 92% 50%)` as text on a 12% tint of itself over white, which computes to about 1.95:1. Muted text passes in both themes (5.3:1 to 7.3:1).
- **Impact:** The main action button on every page and the page badge are hard to read for low-vision users in the light theme, and fail AA.
- **Before (current code):**
  ```css
  .page-hero-primary {
    background: hsl(var(--metric-classes));
    color: hsl(0 0% 100%);
  ...
  .page-hero-badge {
    background: hsl(var(--metric-fees) / 0.12);
    color: hsl(var(--metric-fees));
  }
  ```
- **After (recommended fix):**
  ```css
  .page-hero-primary { background: hsl(160 84% 24%); color: #fff; }   /* about 6:1 */
  .dark .page-hero-primary { background: hsl(160 84% 30%); }
  .page-hero-badge { color: hsl(38 92% 28%); }                       /* check >= 4.5:1 on the tint */
  .dark .page-hero-badge { color: hsl(38 92% 60%); }
  ```

### W26. Clickable table rows are `<tr tabIndex>` and `role="button"` cards; no `aria-sort`, `scope` or caption
- **Severity:** Warning
- **Category:** Accessibility
- **Location:** `src/components/patients/patients-data-table.tsx:263-269` (row), `:191-196` (compact card), `:62-73` (`renderSortableHeader`); the same pattern in `medicines-data-table.tsx:162` and `diseases-data-table.tsx:163`
- **Problem:** A navigation action is exposed as a `<tr tabIndex={0} onClick>`, which screen readers announce as a row with no hint that it opens a record (a focusable row is an ARIA anti-pattern). The card variant is a `div role="button"` that contains real buttons (nested interactive controls). The 32 `<th>` elements have no `scope`, sortable headers never set `aria-sort`, and no table has a `<caption>`.
- **Impact:** Screen-reader and voice-control users cannot tell which column is sorted or that a row opens a record, and each row has a double tab stop.
- **Before (current code):**
  ```tsx
  <tr
    key={patient.id}
    tabIndex={0}
    className="clinic-table-row clinic-table-row-clickable ..."
    onClick={() => onView(patient)}
    onKeyDown={(e) => handleRowKeyDown(e, () => onView(patient))}
  >
  ```
- **After (recommended fix):**
  ```tsx
  <tr key={patient.id} className="..." onClick={() => onView(patient)}>   {/* mouse convenience only */}
    <td><Link href={ROUTES.patient(patient.id)} className="after:absolute after:inset-0">{name}</Link></td>
  ...
  <th scope="col" aria-sort={sortField === col.field ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
  <table><caption className="sr-only">Patients</caption>
  ```

### W27. `globals.css` is 6,457 lines and most retired hero selectors are still shipped
- **Severity:** Warning
- **Category:** Styling / dead CSS
- **Location:** `src/styles/globals.css` lines 525, 544, 627-660, 992-1052, 1280, 1523, 1576, 1884, 2218, 2316, 2724, 3066, 5969, 6282
- **Problem:** Searches over `src` find no users for `dashboard-hero-mesh`, `clinic-hero-mesh`, `clinic-hero-badge`, `vault-hero-mesh/-scanline/-badge`, `flag-config-hero-mesh`, the per-module `*-hero-mesh` blocks and the two `*-create-hero-mesh` blocks. School-era `teachers-*`, `attendance-*`, `exams-*` and `classes-*` blocks remain (209 selectors). The file holds 49 `@keyframes` and 75 `animation:` declarations that the motion policy forces to `animation: none !important`, so all are dead at runtime, plus 9 redundant `prefers-reduced-motion` copies and 63 `!important` rules.
- **Impact:** Every page downloads and parses a 6.4k-line global stylesheet; dead rules hide the live ones and make the "one PageHero" convention hard to verify.
- **Before (current code):**
  ```css
  .dashboard-hero-mesh {   /* line 525: 0 usages in src */
  ...
  .page-hero-mesh {        /* the only live hero block */
  ```
- **After (recommended fix):**
  ```text
  Delete the unused *-hero-mesh/-badge/-scanline/-date blocks and the school-era blocks, delete every @keyframes with no live
  animation, keep one reduced-motion rule, then split globals.css into tokens.css / base.css / components/*.css.
  Check each selector with a grep before removing it.
  ```

### W28. A universal `:not()`-chain selector with `!important` runs against every element
- **Severity:** Warning
- **Category:** Styling / performance / motion policy
- **Location:** `src/styles/globals.css:6378-6384`
- **Problem:** `*:not(.animate-pulse):not(.dashboard-skeleton):not(.animate-breathing):not([data-skeleton])` (plus its `::before` and `::after` variants) forces `animation: none !important` on everything. It makes the Radix `animate-in` and `animate-out` classes used by `tailwindcss-animate` inert (17 wrappers), leaves 12 inline `animationDelay` styles and 33 animation-class uses as no-ops, and leaves the skeleton pulse out of any `prefers-reduced-motion` handling.
- **Impact:** A style-recalculation cost on large tables, and users who set reduced motion still get the pulsing skeleton.
- **Before (current code):**
  ```css
  *:not(.animate-pulse):not(.dashboard-skeleton):not(.animate-breathing):not([data-skeleton]) {
    animation: none !important;
  }
  ```
- **After (recommended fix):**
  ```css
  /* remove the universal rule and the dead animations at source; keep only: */
  @media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none; } }
  /* and drop tailwindcss-animate and the animate-in/out classes from the ui wrappers */
  ```

### W29. `as` casts hide missing-data and ID-type errors on page boundaries
- **Severity:** Warning
- **Category:** TypeScript
- **Location:** `src/components/diseases/disease-detail-view.tsx:92`, `src/components/medicines/medicine-detail-view.tsx:152`, `src/app/(Navigations)/patients/[id]/page.tsx:62`, `vault/diseases/[id]/page.tsx:33`, `vault/medicine/[id]/page.tsx:32`, `src/lib/diseases/disease-server.ts:73`, `:106`, `src/lib/flags/flag-server.ts:82`, `:190`, `src/lib/patients/patient-server.ts:112`
- **Problem:** `(diseaseProp ?? {}) as Disease` makes an empty object a `Disease`, so every field access type-checks while holding `undefined`, and separate `dataLoading` flags are needed to avoid rendering garbage. `params.id as string` ignores `string | string[]`. Five `as unknown as Record<string, unknown>` casts exist only to pass typed objects to `createFirestoreDocument`, which should accept a generic.
- **Impact:** Latent `undefined` rendering and type-hidden shape drift when `Disease` or `Medicine` change.
- **Before (current code):**
  ```tsx
  const disease = (diseaseProp ?? {}) as Disease
  const dataLoading = !!loading || !diseaseProp
  ```
- **After (recommended fix):**
  ```tsx
  const disease: Disease | undefined = diseaseProp
  const dataLoading = !!loading || !disease
  // read via disease?.name; and make the helper generic: createFirestoreDocument<T extends object>(path, token, data: T)
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  ```

### W30. Every page shares one title because metadata exists only in the root layout
- **Severity:** Warning
- **Category:** SEO / metadata (usability)
- **Location:** `src/app/layout.tsx:17-21`; all `src/app/(Navigations)/*/page.tsx` are client components and cannot export `metadata`
- **Problem:** `grep metadata src/app` returns only the root layout, so Dashboard, Patients, Billing and the rest all show "MediFlow — Homeopathy Medicine Management" in the tab, history and bookmarks. There is no `title.template`, `metadataBase` or `robots` metadata, and `public/manifest.json` exists but is never linked from `src`. Search ranking is irrelevant here because `public/robots.txt` disallows everything (deliberate and correct for a private clinic app).
- **Impact:** Poor usability for users with several tabs open; no installable-app manifest.
- **Before (current code):**
  ```ts
  export const metadata: Metadata = {
    title: 'MediFlow — Homeopathy Medicine Management',
    description: 'Homeopathy clinic management — patients, medicine vault, prescriptions, and billing',
    applicationName: 'MediFlow',
  }
  ```
- **After (recommended fix):**
  ```ts
  export const metadata: Metadata = {
    title: { default: 'MediFlow', template: '%s | MediFlow' },
    description: '...',
    manifest: '/manifest.json',
    robots: { index: false, follow: false },
  }
  // a tiny server layout.tsx per section: export const metadata = { title: 'Patients' }; export default ({ children }) => children
  ```

---

## 💡 Improvements & Best Practices
*Worth addressing: DX, consistency, minor performance gains, and future-proofing*

### S1. `next lint` is deprecated and `tsconfig.json` is stale and only `strict`
- **Severity:** Suggestion
- **Category:** Configuration
- **Location:** `package.json:9`; `tsconfig.json:3-5`, `:12`, `:66-77`; `eslint.config.mjs:12-14`
- **Problem:** `"lint": "next lint"` is deprecated in Next 15.5 and removed in Next 16 (the CLI prints the codemod hint). `target: "es5"` with `lib: ["es6"]` while source uses `Object.entries`; `include` lists a stale `.next-dev5/types/**/*.ts`; `exclude` skips `tests/**/*`; no `noUncheckedIndexedAccess`, `noImplicitReturns` or `noFallthroughCasesInSwitch`. ESLint does not ignore `.next*` build folders, so a bare `eslint .` lints build output.
- **Impact:** Future upgrade breakage, unchecked index access and rotting test code.
- **Before (current code):**
  ```json
  "lint": "next lint",
  "target": "es5",
  "lib": ["dom", "dom.iterable", "es6"],
  "exclude": ["node_modules", ".cursor/**/*", "tests/**/*"]
  ```
- **After (recommended fix):**
  ```json
  "lint": "eslint . --max-warnings=0",
  "target": "ES2022", "lib": ["dom", "dom.iterable", "esnext"],
  "noUncheckedIndexedAccess": true, "noImplicitReturns": true, "noFallthroughCasesInSwitch": true
  // eslint.config.mjs: ignores: ['.next*/**']; add tests/tsconfig.json extending the root for Playwright
  ```

### S2. Large files and God modules, plus two toast systems
- **Severity:** Suggestion
- **Category:** Architecture
- **Location:** `src/lib/labels.ts` (1,089 lines), `src/services/pharmacy-api.ts` (784), `src/components/patients/patient-form-fields.tsx` (677), `src/lib/patients/patient-profile-detail.ts` (578), `inventory-stock-table.tsx` (432), `patient-registration-form.tsx` (423), `medicine-vault-form.tsx` (407), `patients-data-table.tsx` (401); `src/app/layout.tsx:44-48` mounts both a custom `ToastContext` and `sonner`
- **Problem:** `pharmacy-api.ts` mixes billing, settings, staff, dashboard stats and dead attendance and inventory functions; `labels.ts` carries school remnants; two toast systems are mounted.
- **Impact:** Hard to review, poor tree-shaking of the service module in the client bundle.
- **Before (current code):**
  ```
  784 src/services/pharmacy-api.ts     1089 src/lib/labels.ts
  ```
- **After (recommended fix):**
  ```
  Split pharmacy-api.ts into billing-api.ts, settings-api.ts, dashboard-api.ts; delete the dead functions and school labels;
  keep one toast library.
  ```

### S3. Over 35 presentational components carry `'use client'` without needing it
- **Severity:** Suggestion
- **Category:** Server vs client boundary
- **Location:** for example `src/components/shared/page-header.tsx:1`, `bento-grid.tsx:1`, `glass-panel.tsx:1`, `status-badge.tsx:1`, `animated-stat.tsx:1`; the `*-skeleton.tsx` files, `dashboard-stat-tile.tsx`, `vault-hub-card.tsx`, `not-found-content.tsx`, `disease-symptom-badges.tsx`
- **Problem:** These files have no hooks, handlers or browser APIs. A `'use client'` file imported only by other client files costs no extra bytes today; the harm is blocking server composition and a misleading boundary, which makes a later move of pages to server components harder.
- **Impact:** Modest today; it constrains future server-component conversion.
- **Before (current code):**
  ```tsx
  'use client'
  // components/shared/page-header.tsx:1 - no hooks, no state, pure markup
  ```
- **After (recommended fix):**
  ```tsx
  // remove the directive from presentational files; they still work when imported by a client parent
  ```

### S4. No Origin or Fetch-Metadata check on cookie-setting POST routes
- **Severity:** Suggestion
- **Category:** CSRF (defence in depth)
- **Location:** `src/app/api/auth/session/route.ts:5`; `logout/route.ts:15`; `register/route.ts:30`; `admin/users/route.ts:5`; `admin/users/[id]/route.ts:14`
- **Problem:** Cookie-authenticated routes rely only on `SameSite=Lax`, which blocks cross-site POSTs that carry the cookie, so no exploitable CSRF was found. The session route could in theory receive a cross-site form POST that plants a session for an attacker's account (login CSRF), but it needs the attacker's own valid ID token and has little impact.
- **Impact:** Low; a second layer only.
- **Before (current code):**
  ```ts
  export async function POST(request: NextRequest) {
    try {
      const { idToken } = (await request.json()) as { idToken?: string }
  ```
- **After (recommended fix):**
  ```ts
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false }, { status: 403 })
  if (request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ success: false }, { status: 403 })
  ```

### S5. Middleware trusts any non-empty `__session` value; the route guard is client-side
- **Severity:** Suggestion
- **Category:** Authentication design
- **Location:** `src/middleware.ts:18-25`; `src/app/(Navigations)/layout.tsx:1`
- **Problem:** `hasSession` is `Boolean(session && session.trim().length > 0)`. Setting `__session=x` in a browser serves the protected page shells and JS bundles with no data; the layout then redirects after Redux state resolves. Data stays protected by the API routes and the rules, so this is a documented trade-off, not a leak, but unauthenticated users can download the authenticated app bundle and see layout flashes.
- **Impact:** UI-code exposure and layout flashes only; no data exposure traced.
- **Before (current code):**
  ```ts
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const hasSession = Boolean(session && session.trim().length > 0)
  ```
- **After (recommended fix):**
  ```ts
  // Optional: verify the session-cookie JWT in middleware with `jose` against Google's public keys (the Edge runtime
  // cannot use firebase-admin), or add a Node server layout that calls adminAuth.verifySessionCookie(cookie, true).
  ```

### S6. The cached profile in `localStorage` drives the first render, including the role
- **Severity:** Suggestion
- **Category:** Client trust
- **Location:** `src/lib/auth-session.ts:20-31`, `:46-63`; `src/redux/slices/authSlice.ts:60-70`
- **Problem:** `initAuth` renders from the cached `user` JSON when the `mf_session` flag exists and verifies in the background. Editing `localStorage.user.role` shows admin navigation until `restoreSession` overwrites it; every admin action still fails at the API or rules, so there is no privilege gain. Name, email and `businessId` stay in plain text on shared machines. No tokens were found in `localStorage`.
- **Impact:** Cosmetic exposure of admin UI and PII at rest in the browser.
- **Before (current code):**
  ```ts
  const cached = readStoredAuthSession()
  if (cached && authService.hasSessionFlag()) {
  ```
- **After (recommended fix):**
  ```ts
  // Render role-gated links and pages only when state.sessionVerified is true; store only { id, name } in the cache.
  ```

### S7. Two identical `ApiAuthError` classes and two overlapping guard modules
- **Severity:** Suggestion
- **Category:** Maintainability
- **Location:** `src/lib/api/require-api-id-token.ts:11-18`; `src/lib/api/require-api-session.ts:5-12`
- **Problem:** `instanceof` only works against the matching module, which is why `POST /api/admin/users` could not reuse the session helper's error handling (W6). The session guard also reads the role raw (`data.role ?? 'staff'` at `:51`) while the ID-token guard goes through `roleHasPermission`.
- **Impact:** It is easy to add a route that checks the wrong error class and returns 500 or 400 for an auth failure.
- **Before (current code):**
  ```ts
  export class ApiAuthError extends Error {
    status: number
    constructor(message: string, status: number) {
  ```
- **After (recommended fix):**
  ```ts
  // src/lib/api/api-auth-error.ts
  export class ApiAuthError extends Error { constructor(message: string, public status: number) { super(message) } }
  // import it in both guards; apply normalizeUserRole() in requireApiSession
  ```

### S8. URL path segments are interpolated into Firestore REST paths without encoding
- **Severity:** Suggestion
- **Category:** Input handling
- **Location:** `src/lib/diseases/disease-server.ts:32`, `:40`, `:71`; `src/lib/firebase/firestore-rest.ts:243`; `src/lib/flags/flag-server.ts:95`, `:164`, `:212`
- **Problem:** `id`, `categoryId` and `flagId` come from route params and go into template strings that form the REST URL. A param that decodes to a value with `/` or `?` changes the target path or query. The call still carries the user's token, so the rules decide the outcome and no tenant escape was found (route-param decoding was not tested).
- **Impact:** Unexpected 400 or 404 for odd ids; a small defence-in-depth gap.
- **Before (current code):**
  ```ts
  return fetchFirestoreDocument<Disease>(`businesses/${businessId}/diseases/${id}`, idToken)
  ```
- **After (recommended fix):**
  ```ts
  const seg = (s: string) => { if (!/^[A-Za-z0-9_-]{1,128}$/.test(s)) throw new ApiAuthError('Not found', 404); return s }
  return fetchFirestoreDocument<Disease>(`businesses/${businessId}/diseases/${seg(id)}`, idToken)
  ```

### S9. Hook-rule suppressions and chained effects in the date-of-birth picker and two dialogs
- **Severity:** Suggestion
- **Category:** React hooks
- **Location:** `src/components/inventory/inventory-adjust-dialog.tsx:92`, `inventory-receive-dialog.tsx:102`, `src/components/ui/date-of-birth-picker.tsx:128`, `:146`
- **Problem:** The dialog resets keyed on `[open, item?.id]` are intentional but are better expressed by remounting (`key={item?.id}`). The date-of-birth picker syncs day, month and year into a date through chained effects, which is derived state, and the omitted `setDate` dependency is the symptom.
- **Impact:** Hidden stale-closure risk and fragile chained effects.
- **Before (current code):**
  ```ts
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setDate is intentionally omitted; an unstable parent callback would loop
  }, [month, year, day])
  ```
- **After (recommended fix):**
  ```ts
  // Derive: const date = year && month && day ? new Date(+year, +month - 1, +day) : undefined
  // call onChange(date) from the three select handlers, not from an effect; for dialogs: <Dialog key={item?.id}>
  ```

### S10. Only two `next/dynamic` usages; heavy dialogs and the login 3D scene are static imports
- **Severity:** Suggestion
- **Category:** Rendering / bundle
- **Location:** `src/components/medicines/flag-config/flag-config-dialogs.tsx` (378 lines), `inventory-item-form-dialog`, `patients-form-dialog`, `src/components/auth/login-3d-scene.tsx`, `login-video-background.tsx`
- **Problem:** The login page decoration (3D scene and video) is client JS in the first route everyone loads, and rarely opened dialogs are statically imported by their pages. `next/dynamic` is used only in `billing/page.tsx:16` and `dashboard-trend-card.tsx:9`.
- **Impact:** A larger initial JS payload on login and on pages that open dialogs rarely.
- **Before (current code):**
  ```tsx
  <ThemeProvider defaultTheme="light" storageKey="theme">
    <ReduxProvider>
      <ToastProvider>
        <OfflineOverlay />
  ```
- **After (recommended fix):**
  ```tsx
  const FlagConfigDialogs = dynamic(() => import('@/components/medicines/flag-config/flag-config-dialogs'))
  // render only when a dialog opens; lazy-load login-3d-scene with ssr:false after first paint
  ```

### S11. Memoisation is sparse and row components are not memoised
- **Severity:** Suggestion
- **Category:** Rendering
- **Location:** `src/components/inventory/inventory-stock-table.tsx`, `patients/patients-data-table.tsx`, `diseases/diseases-data-table.tsx`
- **Problem:** `React.memo` is not used in `components/`, and row components receive inline closures. With client-side pagination at 8 rows this is cheap today, so it is low priority; it matters only if the page size grows.
- **Impact:** Minor re-render cost.
- **Before (current code):**
  ```text
  grep "memo(" in src/components returns nothing
  ```
- **After (recommended fix):**
  ```tsx
  const Row = React.memo(function Row({ item, onAdjust }: Props) { /* ... */ })  // with stable useCallback handlers from the hook
  ```

### S12. Permanent (308) redirects for `/medicines`
- **Severity:** Suggestion
- **Category:** Configuration
- **Location:** `next.config.ts:71-72` (verified)
- **Problem:** `/medicines` and `/medicines/:path*` redirect with `permanent: true`, which browsers cache indefinitely. If routes change again, returning visitors keep the old redirect.
- **Impact:** Hard to undo later.
- **Before (current code):**
  ```ts
  { source: '/medicines', destination: '/vault/medicine', permanent: true },
  ```
- **After (recommended fix):**
  ```ts
  { source: '/medicines', destination: '/vault/medicine', permanent: false },
  ```

### S13. `.firebaserc` has no `prod` alias
- **Severity:** Suggestion
- **Category:** DevOps
- **Location:** `.firebaserc:3`; `package.json:11-12`, `:19`
- **Problem:** `npm run firebase:deploy:rules` deploys to the default alias, which is the test project (safe by default), but there is no `prod` alias, so production deploys rely on the GitHub workflow or a manual `--project`. There is no `.nvmrc`; `engines` is `>=22 <25`.
- **Impact:** Operational ambiguity.
- **Before (current code):**
  ```json
  { "projects": { "default": "mediflow-test-11bbe" } }
  ```
- **After (recommended fix):**
  ```json
  { "projects": { "default": "mediflow-test-11bbe", "prod": "mediflow-prod-cc377" } }
  ```

### S14. 948 arbitrary Tailwind values, sub-12px text and hard-coded colours
- **Severity:** Suggestion
- **Category:** Styling
- **Location:** project wide, for example `src/app/(Navigations)/inventory/page.tsx:254`, `src/components/billing/stat-card-content.tsx:49`
- **Problem:** 948 arbitrary `prop-[value]` utilities, 134 `text-[Npx]` (97 of them 9 to 11px), 70 raw hex or rgb literals in tsx (for example `text-red-600 dark:text-red-400` instead of `text-destructive`) and 1,389 colour literals in `globals.css`. `text-muted-foreground/NN` appears 21 times, which lowers the 5.7:1 base ratio below 4.5:1 at opacities under about /80.
- **Impact:** Weak design-token discipline, and small dimmed text that is hard to read.
- **Before (current code):**
  ```tsx
  <span className="ml-1.5 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
  ```
- **After (recommended fix):**
  ```tsx
  <span className="ml-1.5 rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs font-bold text-destructive">
  // add fontSize.2xs in tailwind.config.js if a smaller step is wanted; avoid opacity on muted text
  ```

### S15. Test hygiene: a fixed sleep, a single worker, no accessibility assertions, a hand-rolled rules runner
- **Severity:** Suggestion
- **Category:** Testing
- **Location:** `tests/e2e/app.spec.ts:34`; `playwright.config.ts:13-15`; `tests/rules/firestore.rules.test.mjs`
- **Problem:** One hard `waitForTimeout(500)`; `workers: 1` and `fullyParallel: false`; the rules suite is a custom `t()` runner with no per-test reporting or `--grep`; no `@axe-core/playwright` check although the app has accessibility conventions (only "one h1 per page" is asserted).
- **Impact:** A slow serial suite, a timing-based wait, and accessibility regressions go undetected.
- **Before (current code):**
  ```ts
  await expect(page.locator('main h1:visible')).toHaveCount(1, { timeout: 30_000 })
  await page.waitForTimeout(500)
  ```
- **After (recommended fix):**
  ```ts
  await expect.poll(() => page.locator('[aria-busy="true"]').count()).toBe(0)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations).toEqual([])
  ```

### S16. Documentation and dependency drift
- **Severity:** Suggestion
- **Category:** Dependencies
- **Location:** `CLAUDE.md` line 8; `package.json:50-66`, `:73`, `vercel.json:4`
- **Problem:** `CLAUDE.md` lists ECharts 6.0.0, but `echarts` is not in `package.json` (verified); `recharts` is the only chart library. `@types/node` is `^20` while `engines` requires Node 22 or newer. `prettier` is installed with a `.prettierrc` but there is no `format` script or CI check. `tailwindcss-animate` is inert (W28) and `@tailwindcss/aspect-ratio` is needed only by an unused wrapper. `--legacy-peer-deps` in `vercel.json` and CI hides real peer conflicts (React 19 against older peers).
- **Impact:** Misleading documentation, minor drift, and masked peer conflicts.
- **Before (current code):**
  ```json
  "installCommand": "npm ci --legacy-peer-deps",
  "@types/node": "^20",
  ```
- **After (recommended fix):**
  ```text
  Fix CLAUDE.md (no ECharts); bump @types/node to ^22; add "format": "prettier --write ." or remove prettier;
  run `npm ls` to find the peer conflict, add targeted overrides, then drop --legacy-peer-deps.
  ```

### S17. No skip link and almost no `aria-live` regions
- **Severity:** Suggestion
- **Category:** Accessibility
- **Location:** `src/app/(Navigations)/layout.tsx`; project wide (2 `aria-live` or `role="status"` matches); `src/components/patients/patients-data-table.tsx:158`; `src/components/ui/form.tsx:116`
- **Problem:** There is no skip-to-content link, so keyboard users tab through the whole sidebar on every page. There are 44 `aria-busy` wrappers but only 2 live regions, so loading-to-loaded changes and empty-table messages ("No patients match your filters") are not announced. `ui/form.tsx:116` always sets `aria-describedby` to the description id even when no `FormDescription` is rendered, leaving a dangling reference.
- **Impact:** Slower keyboard navigation and missed result updates for screen-reader users.
- **Before (current code):**
  ```tsx
  <tr>
    <td colSpan={columnCount} className="clinic-table-empty">
      No patients match your filters
    </td>
  </tr>
  ```
- **After (recommended fix):**
  ```tsx
  <td colSpan={columnCount} className="clinic-table-empty" role="status">No patients match your filters</td>
  // layout: <a href="#main" className="sr-only focus:not-sr-only ...">Skip to content</a>
  ```

---

## 🏁 Production Readiness Checklist

### Security
- [x] HTTP security headers configured (CSP, HSTS, X-Frame-Options, etc.); the CSP itself is weak (W10)
- [x] No secrets exposed via `NEXT_PUBLIC_` env vars
- [x] All API routes and Server Actions are authenticated & authorized (no Server Actions are used; every `/api/v1` handler is guarded)
- [ ] User input validated with schema (Zod / Valibot) on server (W6, W8, W9)
- [ ] Rate limiting on auth and mutation endpoints (W5)
- [x] Cookies use HttpOnly + Secure + SameSite flags
- [x] No `dangerouslySetInnerHTML` with unsanitized input (none used)
- [x] No hardcoded credentials or API keys in source (project ids appear in a few files; they are identifiers, not secrets)

### Performance
- [ ] All images using `next/image` with correct props (3 raw `<img>`, all in unused or footer components; `images.unoptimized` is set)
- [x] Fonts loaded via `next/font` only
- [ ] `"use client"` pushed to leaves of component tree (219 of 407 files; every page; W2, S3)
- [ ] Heavy/below-fold components use `next/dynamic` (only 2 usages; S10)
- [ ] Data fetching uses correct cache strategies (none; C1, C2, C3, W16)
- [ ] No waterfall fetches: parallel fetches where possible (JS, auth, token, API chain; W2)
- [ ] Bundle size analyzed and within acceptable limits (not measured in this review; shared first-load JS is about 102 kB, but barrels and dead code (W20, W21) are unmanaged)

### Correctness & Quality
- [x] `strict: true` in `tsconfig.json`
- [x] No `any` types (0 real uses)
- [ ] All `useEffect` dependencies are correct (5 suppressions; races in W19; S9)
- [ ] Error boundaries at all critical route segments (W1)
- [ ] All async operations have error handling (W14 swallows errors; W7 leaks them)
- [ ] No `console.log` in production code (2 in the dead `ui/input-dropdown.tsx:89,104`; 34 `console.error`/`warn` calls, mostly server logging)

### SEO & Accessibility
- [ ] `metadata` / `generateMetadata` on every page (W30)
- [x] `sitemap.ts` and `robots.ts` present and correct (not applicable: a private app, and `public/robots.txt` disallows all, deliberately)
- [x] All images have `alt` attributes
- [ ] Keyboard navigation works on all interactive elements (rows are reachable, but anti-patterns remain: W26, S17)
- [ ] Color contrast meets WCAG 2.1 AA (the primary button and badge fail: W25)
- [x] Semantic HTML and heading hierarchy correct (one `<h1>` per page, verified by e2e)

### DevOps & Config
- [x] `next.config.js` hardened for production (headers, `poweredByHeader`, build fails on errors)
- [x] `.env.example` documented and up to date
- [x] ESLint + TypeScript checks pass cleanly (0 warnings, 0 errors)
- [ ] CI pipeline running lint, types, and tests (lint, types and rules tests: yes; e2e and unit tests: no; W23)
- [ ] No deprecated Next.js APIs in use (`next lint` is deprecated: S1)

---

## 🔧 Priority Refactors

1. **Replace whole-collection reads with queries, counters and a cache (fixes C1, C2, C3, W16, W17, W18).** Highest ROI: it removes the quota risk and the latency that grows with clinic size.
   ```ts
   // before: list route reads everything, then slices
   let result = await fetchPatientRecords(idToken, businessId)
   const paged = paginate(result, page, limit)
   // after: bounded query with a cursor, counts from aggregation, stock cached with a TTL
   const snap = await runQuery(`businesses/${b}/patients`, { orderBy: 'createdAt desc', limit: Math.min(limit, 100), startAfter: cursor }, idToken)
   const [{ count }] = await getCountFromServer(query(colRef(b, 'patients'), where('status', '==', 'active')))
   ```
2. **Close the cross-tenant hole and make the registration switch server-side (fixes C4, W4, W5).** Per-tenant flag taxonomy (or a `platformAdmin` claim as the interim), `ALLOW_REGISTRATION` read at runtime and failing closed, and a shared rate limiter.
3. **Add one validation and error layer for every API route (fixes W6, W7, W8, W9, W14, S7, S8).**
   ```ts
   export function route<T>(schema: z.ZodType<T>, handler: (ctx: Ctx, body: T) => Promise<Response>) {
     return async (req: NextRequest) => {
       try {
         const body = schema.safeParse(await req.json().catch(() => null))
         if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
         return await handler(await requireApiIdToken(req), body.data)
       } catch (e) { return toResponse(e) }   // ApiAuthError, DomainError, Firestore errors -> safe status and message
     }
   }
   ```
4. **Add error boundaries, loading states and route metadata (fixes W1, W2, W30).** `global-error.tsx`, `(Navigations)/error.tsx`, `(Navigations)/loading.tsx`, and a small server layout per section for the page title; then move static hero markup out of client pages.
5. **Prune dead code and tighten the test gate (fixes W21, W23, W24, W27, W28, S16).** Delete the 45 unused UI files, test routes, legacy functions, mock notifications and dead CSS, then remove the orphaned packages; run the rules tests inside `deploy-rules.yml` and add a nightly Playwright run plus Vitest for `stock-utils` and `permissions`.

---

## 📊 Issues Summary

| Severity | Count |
|---|---|
| 🚨 Critical | 4 |
| ⚠️ Warning | 30 |
| 💡 Suggestion | 17 |
| **Total** | **51** |

---

## 🔬 Coverage and limits

- **Read in full or in the relevant ranges:** `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, both workflows, `firestore.rules`, `.env.example`, all 17 API route files, `src/middleware.ts`, `src/lib/api/**`, `src/lib/firebase/**`, `src/lib/permissions.ts`, the auth service and slice, the patient, disease and flag server modules, the data and stock services, five directory/stock hooks, the stock slice, the registration form, the data tables for patients, medicines and diseases (accessibility parts), the shared and UI primitives named in the findings, the three e2e specs (heads and greps), the rules tests, `src/context/*` (NotificationContext head) and `src/lib/stock-utils.ts` (expiry maths, found sound).
- **Covered by pattern scans only (not read line by line):** the remaining ~300 files under `src/components` and `src/lib`, most of `src/components/ui`, `package-lock.json`, `firestore.indexes.json`, the `advanced-*` inputs, `filter-toolbar.tsx`, `src/services/medicine-api.ts`, `disease-api.ts`, `flag-api.ts`, the migration scripts and the remaining shell scripts. Counts for casts, `any`, `!important`, arbitrary values and accessibility attributes come from repository-wide `grep` over all of `src`.
- **Not measured:** real bundle sizes per route, Lighthouse scores, Firestore reads from a live session, and runtime behaviour of the CSP in a browser. The 3 Critical performance findings are derived from the code paths and the read quota that was exhausted during testing, not from a profiler.
- **Corrections made while verifying:** the "no `global-error.tsx`" item was downgraded from Critical to Warning (Next shows a default fallback, not a blank page); the single `any` hit is a code comment; the amber badge contrast is 1.95:1 by calculation; `echarts` is not installed even though `CLAUDE.md` lists it.

---

## 📚 References

- Next.js error handling and `global-error`: https://nextjs.org/docs/app/getting-started/error-handling and https://nextjs.org/docs/app/api-reference/file-conventions/error
- Next.js loading UI and streaming: https://nextjs.org/docs/app/api-reference/file-conventions/loading
- Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Content Security Policy with nonces: https://nextjs.org/docs/app/guides/content-security-policy
- ESLint setup (replacing `next lint`): https://nextjs.org/docs/app/api-reference/config/eslint
- OWASP unvalidated redirects: https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
- OWASP input validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- Firestore security rules conditions and data validation: https://firebase.google.com/docs/firestore/security/rules-conditions
- Firestore aggregation queries (count and sum): https://firebase.google.com/docs/firestore/query-data/aggregation-queries
- WCAG 2.1 contrast (minimum): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- ARIA `aria-sort`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort
- Zod: https://zod.dev
