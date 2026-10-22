# MediFlow — Deployment Guide (Firebase + Vercel)

Account to use for both consoles: **shariquecode@gmail.com**.
Everything below that says "sign in" must be done by the account owner in a browser; no credentials are stored in this repository.

Stack: Next.js 15 on **Vercel** (UI + API routes), **Firebase Auth** (email/password), **Cloud Firestore** (data + security rules).

```
Browser ──► Vercel (Next.js, API routes, Firebase Admin)
   │                       │
   └── Firebase Auth ◄─────┘            Firestore (rules enforce tenant + role)
```

---

## 0. Before you deploy: checklist the code already satisfies

| Check | Command | Expected |
|---|---|---|
| Types | `npm run typecheck` | 0 errors |
| Lint | `npm run lint` | 0 errors |
| Firestore rules | `npm run test:rules` (needs Java) | all assertions pass |
| Production build | `npm run build` | succeeds, no secrets needed |
| End-to-end (test project) | `PLAYWRIGHT_START_SERVER=1 npx playwright test` | all pass |

`npm run verify` runs the first four. Build checks are **on** in `next.config.ts`: a type or lint error fails the deployment instead of shipping.

---

## 1. Firebase (do this first)

Use **two projects**: a throw-away *test* project for rehearsals and the *production* project.
The existing production project is `mediflow-prod`; the test project is `mediflow-test-11bbe`.

### 1.1 Sign in to the Firebase CLI

```bash
npx firebase-tools login
```
A browser opens; choose **shariquecode@gmail.com**. (If that account does not own the project, open the Firebase console → Project settings → Users and permissions and add it as **Owner**.)

```bash
npx firebase-tools projects:list
```

### 1.2 Authentication

Console → **Build → Authentication → Sign-in method**
1. Enable **Email/Password**.
2. **Settings → Authorized domains**: add your Vercel domain(s) (for example `mediflow.vercel.dev` once you know it, and any custom domain). Without this, sign-in fails with `auth/unauthorized-domain`.
3. **Templates → Password reset**: set the sender name and customise the text (the login page's *Forgot password* sends this email).
4. After the owner account exists, consider **Settings → User actions → untick "Enable create (sign-up)"** (requires the Identity Platform upgrade) so strangers cannot create accounts. The app also supports `NEXT_PUBLIC_ALLOW_REGISTRATION=false` (see 2.3) which hides and blocks the `/register` page.

### 1.3 Firestore

1. **Build → Firestore Database → Create database** (production mode, pick the region closest to the clinic; it cannot be changed later).
2. Deploy the rules and indexes from this repo. **Rehearse on the test project first.**

```bash
# rehearsal
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project mediflow-test-11bbe

# production (after the rehearsal passes the Playwright suite)
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project mediflow-prod
```

What the rules enforce (verified by 100+ emulator assertions in `tests/rules/`):
- default deny; every request needs a signed-in, **active** user with a profile;
- tenant isolation: a user can only touch `businesses/{their businessId}/**` (the id is read from their `users` doc, never from the client);
- roles: `super_admin` everything; `staff` read/write patients, payments, prescriptions, stock, read-only medicines/diseases, no settings;
- **stock movements are immutable** (create only, never edited or deleted), must be stamped with the real user id, and stock items can only be deleted at quantity 0;
- users cannot change their own role or tenant (closes the privilege-escalation hole in self-registration).

> Never publish "test mode" rules (`allow read, write: if true`) to production. The test project currently allows any signed-in user to read/write everything; do not copy those rules.

### 1.4 Service account for the server (Vercel)

Console → **Project settings → Service accounts → Generate new private key**. A JSON file downloads. You need three values from it (see 2.2). Delete the JSON file after you paste them into Vercel. If it is ever exposed, revoke it in Google Cloud → IAM → Service accounts → Keys and generate a new one.

### 1.5 Backups (recommended)

Firestore → **Disaster recovery**: enable **Point-in-time recovery** and a **scheduled backup** (daily, 7-day retention). Stock history is an audit trail; do not run without backups.

---

## 2. Vercel

### 2.1 Sign in and create the project

```bash
npx vercel login          # choose "Continue with Email" and use shariquecode@gmail.com
npx vercel link           # create/link the project (framework: Next.js)
```

or import the Git repository in the Vercel dashboard (**Add New → Project**). `vercel.json` already sets the framework, `npm ci --legacy-peer-deps`, the build command, a Mumbai (`bom1`) function region and a 30 s API timeout. **For speed, set `regions` to the Vercel region closest to your Firestore database** (Firestore → Data shows the location; `bom1` is Mumbai, `sin1` Singapore, `iad1` US-East). A server in a different continent from Firestore adds 200-400 ms to every API call. The repository uses **npm** (`package-lock.json`); there is no pnpm lockfile.

### 2.2 Environment variables

Vercel → Project → **Settings → Environment Variables**. Add each variable for **Production** (and Preview if you want preview deployments to work, preferably pointing at the *test* Firebase project).

| Variable | Where it comes from | Secret? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase → Project settings → Your apps → Web app → Config | no |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same | no |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same | no |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same | no |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same | no |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same | no |
| `FIREBASE_ADMIN_PROJECT_ID` | service-account JSON `project_id` | yes |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | service-account JSON `client_email` | yes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | service-account JSON `private_key` | **yes** |
| `NEXT_PUBLIC_ALLOW_REGISTRATION` | `true` for the first deploy, then `false` | no |

`FIREBASE_ADMIN_PRIVATE_KEY`: paste the value on **one line with the literal `\n` sequences** (the code converts them), e.g. `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n`. Mark it **Sensitive**.

`NEXT_PUBLIC_*` values are inlined at build time: changing one requires a **redeploy**.

### 2.3 First deployment

```bash
npx vercel --prod
```
(or push to the production branch).

1. Open the production URL, go to **/register** and create the **owner** account. The server route `/api/auth/register` creates the Auth user, the `super_admin` profile and the clinic document with the Admin SDK (the Firestore rules do not allow browsers to create these documents).
2. Back in Vercel set `NEXT_PUBLIC_ALLOW_REGISTRATION=false` and **redeploy**. `/register` redirects to the login page, the "Create account" links disappear, and the `/api/auth/register` route answers 403, so nobody else can open a clinic. Add staff users from **Settings → Users** instead.
3. Add the Vercel URL to Firebase **Authorized domains** if you have not already.

### 2.4 Post-deploy verification

Run the public suite against the live URL (no credentials needed):

```bash
PLAYWRIGHT_BASE_URL=https://<your-domain> E2E_PROD=1 npx playwright test --project=public
```
It checks the login page, that all 12 protected routes redirect to login, that the API answers `401` without a token, the security headers, and that `/test-*` pages are 404.

Then sign in manually and walk through: dashboard → vault (add a medicine) → **Stock & Inventory** (add stock item → receive stock → dispense) → patients → billing → settings.

---

## 3. Day-2 operations

| Task | How |
|---|---|
| Roll back a bad release | Vercel → Deployments → previous deployment → **Promote to Production** (instant) |
| Roll back rules | Firebase → Firestore → Rules → history → select version → Publish |
| Rotate the Admin key | Generate new key (1.4) → update the 3 Vercel variables → redeploy → delete the old key in Google Cloud IAM |
| Add a staff member | Settings → Users → Add Admin User (role `staff`) |
| Disable a leaver | Settings → Users → Disable (they are signed out and blocked by the rules) |
| Export data | Firestore → Import/Export (gcloud `firestore export`) or scheduled backups |
| Cost control | Firestore reads dominate; the app loads stock items once per visit and the latest 300 movements. Check **Usage** monthly |

---

## 4. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Login works locally but fails on Vercel with `auth/unauthorized-domain` | Add the Vercel domain to Firebase Authorized domains (1.2) |
| `Firebase Admin credentials are not configured` (500 on `/api/auth/session`) | One of the three `FIREBASE_ADMIN_*` variables is missing/empty; set it for the right environment and redeploy |
| `Failed to parse private key` | The key lost its `\n` sequences or the quotes were pasted into Vercel's value; paste it exactly as in 2.2 |
| After login you bounce back to the login page | Session cookie not set: check `/api/auth/session` response in the network tab (see previous row), and that the site is served over HTTPS |
| `Missing or insufficient permissions` in the console | Rules were not deployed to *this* project, or the user has no `users/{uid}` profile / is disabled |
| Stock page empty on a new clinic | Expected: click **Add stock item**, pick a medicine from the vault (add medicines in **Vault** first) |
| Build fails in CI with type/lint errors | Intentional: fix the error; do not re-enable `ignoreBuildErrors` |
| `next build` overwrites a running dev server's assets (400 on every JS/CSS) | Stop `next dev` before running `next build` locally |

---

## 5. Local development

```bash
cp .env.example .env.local      # fill in the TEST project's values
npm ci --legacy-peer-deps
npm run dev                     # http://localhost:3000
npm run verify                  # types + lint + rules tests + build
npx playwright install chromium # once
PLAYWRIGHT_START_SERVER=1 npx playwright test   # needs a production build: npm run build
```

Use the **test** Firebase project for local work and for Playwright (`TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env.local`, never in git). Never point automated tests at the production project.
