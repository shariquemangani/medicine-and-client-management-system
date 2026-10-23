# End-to-end setup: GitHub CI/CD + Vercel + Firebase (test and prod)

A reusable guide to wire this app to **any** pair of Firebase projects and Vercel projects. Replace the
`<placeholders>`; nothing here is specific to one clinic. Never paste real keys into the repo, chat or tickets.

```
feature branch ──PR──► dev ──PR──► main
                        │           │
   GitHub Actions   CI (verify)   CI (verify)
                        │           │
   Vercel           project "test"  project "prod"      (each builds its own branch)
                        │           │
   Firebase         <test-project>  <prod-project>      (separate Auth, Firestore, rules, quota)
   Firestore rules  deploy-rules.yml publishes on merge: dev -> test project, main -> prod project
```

Rule of thumb: **one environment = one Firebase project + one Vercel project + one service-account key per consumer.**

---

## 0. What you need

| Item | Notes |
|---|---|
| GitHub repository | with branches `main` (production) and `dev` (staging) |
| Two Firebase projects | `<test-project>` and `<prod-project>`; Blaze (pay-as-you-go) recommended, the free allowance still applies |
| Two Vercel projects | both import the **same** GitHub repo |
| Node 22 or newer | `firebase-admin` 14 needs it; set `engines` in `package.json` and `node-version: 22` in CI |
| A password manager | for the service-account JSON keys and your Vercel 2FA |

---

## 1. GitHub

1. Push the code. Create `dev` from `main`: `git checkout -b dev && git push -u origin dev`.
2. **Protect `main`** (Settings → Rules → Rulesets → New branch ruleset):
   - Enforcement: **Active**; target: **Default branch**.
   - Tick **Require a pull request before merging** (0 approvals is fine for a solo repo).
   - Tick **Require status checks to pass** and add the check named **`verify`** (it only appears in the picker after the CI workflow has run once).
   - Keep **Block force pushes** on.
3. Workflows already in the repo (`.github/workflows/`):
   - `ci.yml`: on push/PR to `main` and `dev`. Runs `npm run typecheck`, lint, the Firestore **rules tests** (emulator, needs Java), verification scripts and a production build. It uses dummy Firebase values, so it needs **no secrets**.
   - `deploy-rules.yml`: publishes `firestore.rules` after a push to `main` or `dev` that changes the rules file. Needs the two secrets in section 5.
4. Day-to-day flow: branch off `dev` → PR into `dev` → green CI → merge → test site updates → PR `dev` → `main` → merge → prod updates.

---

## 2. Firebase (repeat for each project)

1. Console → **Add project**. Upgrade to **Blaze** if you want billing instead of hard daily limits.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → production mode → choose the region closest to your users (cannot be changed later). Remember it: put the Vercel function region near it.
4. **Project settings → General → Your apps → Add app → Web**. Open the **Config** snippet; you need these six values for Vercel:
   `apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId`.
5. **Authentication → Settings → Authorised domains**: add each Vercel domain that will serve this project (for example `<name>.vercel.app` and any custom domain). Without this, sign-in fails with `auth/unauthorized-domain`.
6. **Service accounts → Generate new private key** (a JSON file). Make **one key per consumer**:
   - one for **Vercel** (server routes use the Admin SDK),
   - one for **GitHub Actions** (rules deploy).
   Separate keys can be rotated independently. Store them in a password manager; delete the downloaded files afterwards.
7. **First rules deploy by hand** (afterwards the pipeline does it):
   ```bash
   FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" npx tsx scripts/deploy-firestore-rules.ts --project <project-id>
   # or: npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <project-id>
   ```
   Never publish "test mode" rules (`allow read, write: if true`) to a real project. The repo's `firestore.rules` is tenant- and role-aware and covered by 120+ emulator tests (`npm run test:rules`).
8. Optional but recommended on prod: Firestore → Disaster recovery → enable point-in-time recovery and a scheduled backup.

---

## 3. Vercel (repeat for each environment)

1. **Add New → Project → Import** the GitHub repo. Create it **twice**, with different names (for example `<app>-test` and `<app>-prod`). Framework Next.js, root `./`.
2. **Production branch** (Project → Settings → Environments → Production → Branch Tracking):
   - prod project: `main` (default).
   - test project: change it to `dev`, so every `dev` push becomes that project's "Production" deployment.
3. `vercel.json` already sets `npm ci --legacy-peer-deps`, the build command, a function region and a 30 s API timeout. **Change `regions` to the region nearest your Firestore database** (for example `bom1` Mumbai, `sin1` Singapore, `iad1` US East).
4. Node version: Project → Settings → Build and Deployment → Node.js Version (24.x works).
5. Environment variables (Settings → Environment Variables). Add them **per project, with that project's own Firebase values**:

   | Variable | Value | Vercel type |
   |---|---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | web config `apiKey` | **Config** |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` | Config |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | Config |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` | Config |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | Config |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` | Config |
   | `FIREBASE_ADMIN_PROJECT_ID` | service-account `project_id` | **Secret** |
   | `FIREBASE_ADMIN_CLIENT_EMAIL` | service-account `client_email` | Secret |
   | `FIREBASE_ADMIN_PRIVATE_KEY` | service-account `private_key` on **one line**, keep the literal `\n` sequences | Secret |
   | `NEXT_PUBLIC_ALLOW_REGISTRATION` | `true` until your owner account exists, then `false` | Config |

   Notes:
   - `NEXT_PUBLIC_*` values are sent to the browser, so Vercel **refuses to store them as Secret**. They are public identifiers; Firestore rules are what protect data.
   - Import tip: **Import .env** can create many variables at once, but the dialog applies one type to all rows. Do two imports: public values as **Config**, admin values as **Secret**.
   - Editing a Secret asks for your authenticator code.
   - **A variable change only takes effect after a new deployment** (Deployments → latest → ⋯ → Redeploy; untick build cache).
   - **The public and admin values of one project must belong to the same Firebase project.** If they differ, registration creates the user in one project and the browser signs in against another ("Invalid email or password").

6. Add the Vercel domain to that Firebase project's **Authorised domains** (section 2, step 5).

---

## 4. Wiring check (do this before trusting a new setup)

In the browser console on the deployed site (replace nothing; it only reads public values):

```js
const urls=[...new Set(performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.includes('/_next/static/')&&u.endsWith('.js')))];
const hits={};
for(const u of urls){ const t=await (await fetch(u)).text();
  for(const p of ['<test-project-id>','<prod-project-id>','missing-api-key']) if(t.includes(p)) hits[p]=(hits[p]||0)+1 }
hits   // expect ONLY this environment's project id; 'missing-api-key' means the API key variable is unset
```

Server-side smoke test (should be `200` and `401`, never `500`):

```js
(await fetch('/api/auth/logout',{method:'POST'})).status           // 200
(await fetch('/api/auth/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:'x'})})).status  // 401
```

Then create the owner account on `/register` (or sign in), open each sidebar page, add and delete one record, and read Vercel → Logs for errors.

---

## 5. GitHub secrets and the rules pipeline

Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_TEST` | the whole JSON of the GitHub key for `<test-project>` |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | the whole JSON of the GitHub key for `<prod-project>` |

Edit `.github/workflows/deploy-rules.yml`, line `PROJECT_ID:`, to your own project ids
(`github.ref_name == 'main' && '<prod-project-id>' || '<test-project-id>'`). The script
`scripts/deploy-firestore-rules.ts` refuses to run if the key's `project_id` differs from `--project`, so a wrong
secret cannot publish to the wrong project. Also update `.firebaserc` to your test project id.

Behaviour: merge a change to `firestore.rules` into `dev` → test project updated; merge into `main` → prod updated.
With no secret set the workflow only logs a warning and skips.

---

## 6. Rotating a service-account key

1. Console → Project settings → Service accounts → Generate new private key.
2. Put the new values into Vercel (`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`) and/or the GitHub secret.
3. Redeploy; sign in; confirm it works.
4. **Only then** delete the old key: Google Cloud console → IAM & Admin → Service accounts → the account → **Keys** → delete the older key IDs.
5. Delete downloaded JSON files and any `.env` copies. If a key ever appeared in a screenshot, chat or commit, treat it as compromised and rotate immediately.

---

## 7. Troubleshooting (all of these happened during the original setup)

| Symptom | Cause | Fix |
|---|---|---|
| Vercel build fails: `auth/invalid-api-key` while prerendering | API key variable missing at build | Set the six public variables. The code also falls back to a placeholder key so a missing value fails at sign-in instead of failing the build |
| `/api/*` returns 500; log: `require() of ES Module .../jose ... from jwks-rsa` (`ERR_REQUIRE_ESM`) | Vercel's Node runtime rejects `require()` of ESM; `jwks-rsa` 4 needs ESM-only `jose` 6 | `package.json` `overrides: { "jwks-rsa": "3.2.2" }` (already applied) |
| CI build fails: `Cannot find module '@google-cloud/firestore'` | `firebase-admin` 14 needs Node 22; on Node 20 npm silently skips the optional dependency | CI `node-version: 22`, `engines: ">=22 <25"` |
| CI typecheck fails on `.next/types/routes.d.ts` | Next 15.5 references generated route types | `typecheck` script is `next typegen && tsc --noEmit`; `next-env.d.ts` is git-ignored |
| Register shows "Invalid email or password" | Public config and Admin key point at different Firebase projects | Make both belong to the same project, redeploy, run the wiring check (section 4) |
| Test site writes to the production database | Test Vercel project was given the prod public variables | Fix the six public variables, redeploy, re-run the wiring check |
| Firebase "Quota exceeded" at sign-in | Daily Firestore/Auth quota used up (often by repeated test runs) | Wait for the daily reset, enable Blaze, avoid running the full Playwright suite repeatedly |
| Changed an env variable but nothing changed | Variables apply only to new deployments | Redeploy (and untick build cache) |
| "Redeploy" rebuilt old code | Redeploy reuses the old commit | Push a new commit, or redeploy the deployment built from the commit you want |
| Builds sit in `Queued` | Hobby plan builds one project at a time; a push to `dev` builds in **both** Vercel projects | Wait, or disable preview builds on the project that does not need them |
| `Run workflow` button missing for a workflow | `workflow_dispatch` shows only for workflows on the default branch | Merge the workflow into `main`, or trigger it by pushing a change to a watched path |
| `Merge` disabled on a PR | Required check `verify` still running or failed | Wait for it, open the run log, fix, push |
| Vercel asks for a 6-digit code on edit | 2FA protects revealing and editing Secrets | Enter your authenticator code (never share it) |

---

## 8. Checklist for a brand-new project pair

- [ ] GitHub repo with `main` and `dev`; ruleset on `main` requires PR and check `verify`
- [ ] Two Firebase projects: Email/Password on, Firestore created, web app created, domains authorised
- [ ] Rules published to both (`npm run test:rules` green first)
- [ ] Separate service-account keys for Vercel and for GitHub, per project
- [ ] Two Vercel projects; test builds `dev`, prod builds `main`; correct env variables in each; function region set
- [ ] `deploy-rules.yml` project ids and `.firebaserc` edited; both GitHub secrets added
- [ ] Wiring check passes on both sites (own project id only; logout 200; bad token 401)
- [ ] Owner account created, then `NEXT_PUBLIC_ALLOW_REGISTRATION=false` on prod and redeploy
- [ ] Old or exposed keys deleted; downloaded JSON files removed

See also: `docs/DEPLOYMENT.md` (original deployment notes) and `CLAUDE.md` (architecture and conventions).
