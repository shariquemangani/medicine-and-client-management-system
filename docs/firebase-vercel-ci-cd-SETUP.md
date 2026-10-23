# Firebase + Vercel + GitHub CI/CD: complete setup guide

This single file is enough to take this app (Next.js 15 + Firebase Auth + Cloud Firestore) from an empty GitHub repo
to a working **test** and **production** environment with automatic checks, automatic deploys and automatic Firestore
rules publishing. It is written to be reused for **any** new Firebase and Vercel project: replace every
`<placeholder>`, and nothing in it depends on one organisation, person or project.

It covers: the architecture, the requirements, the choices you can make, the exact steps, daily operation, key
rotation, security, troubleshooting, and copy-paste versions of every file the pipeline needs (Appendix A to L).

> Never paste real keys, passwords or one-time codes into the repo, chat tools or tickets. Everything secret in this
> guide goes into Vercel, GitHub or a password manager only.

## Contents

1. [How the pieces fit together](#1-how-the-pieces-fit-together)
2. [Requirements and costs](#2-requirements-and-costs)
3. [Choose your layout (the options)](#3-choose-your-layout-the-options)
4. [Step 1: prepare the code](#4-step-1-prepare-the-code)
5. [Step 2: GitHub](#5-step-2-github)
6. [Step 3: Firebase (once per environment)](#6-step-3-firebase-once-per-environment)
7. [Step 4: Vercel (once per environment)](#7-step-4-vercel-once-per-environment)
8. [Step 5: connect everything and verify](#8-step-5-connect-everything-and-verify)
9. [Step 6: automatic Firestore rules deploys](#9-step-6-automatic-firestore-rules-deploys)
10. [Daily workflow, releases, hotfixes, rollbacks](#10-daily-workflow-releases-hotfixes-rollbacks)
11. [Operations: keys, people, domains, backups, monitoring](#11-operations-keys-people-domains-backups-monitoring)
12. [Security checklist](#12-security-checklist)
13. [Variations and possibilities](#13-variations-and-possibilities)
14. [Troubleshooting](#14-troubleshooting)
15. [Final checklist for a new project pair](#15-final-checklist-for-a-new-project-pair)
16. [Appendices A to L (copy-paste files and snippets)](#appendix-a-ciyml)

---

## 1. How the pieces fit together

```
 developer
    │  git push / pull request
    ▼
 GitHub ──────────────────────────────────────────────────────────────────────────┐
  │  ci.yml  "verify": typecheck, lint, Firestore rules tests (emulator), build     │
  │  ruleset on main: PR required + "verify" must pass                              │
  │  deploy-rules.yml: publishes firestore.rules (dev -> test project, main -> prod)│
  ▼                                                                                 │
 Vercel  (one project per environment, both import the same repo)                   │
  │  project "<app>-test"  builds branch dev   ──► https://<app>-test.vercel.app    │
  │  project "<app>-prod"  builds branch main  ──► https://<app>.vercel.app         │
  ▼                                                                                 │
 Firebase (one project per environment: separate users, data, rules, quota) ◄───────┘
    <test-project-id>  (Auth + Firestore)      <prod-project-id>  (Auth + Firestore)
```

Key ideas:

| Idea | Meaning |
|---|---|
| **Environment** | A matching trio: one Firebase project + one Vercel project + one Git branch (`dev` = test, `main` = production). |
| **Isolation** | Test and production never share users, data or keys. A bug or a test run on the test site cannot touch production data. |
| **Public config** (`NEXT_PUBLIC_*`) | Firebase web identifiers shipped to every browser. Not secret. Data is protected by Firestore rules, not by hiding these. |
| **Admin credentials** (`FIREBASE_ADMIN_*`) | A service-account key used only by server code on Vercel. Secret. |
| **One key per consumer** | Vercel gets its own key; GitHub Actions gets another. Each can be rotated or revoked without breaking the other. |
| **Build vs deploy** | CI (GitHub) checks the code and needs **no secrets**. Deploys happen in Vercel, which builds from Git on every push. Rules are published by a separate small workflow. |

Where the app reads configuration:

- Browser: `NEXT_PUBLIC_FIREBASE_*` (inlined into the JavaScript **at build time**, so changing them needs a rebuild).
- Server routes (`/api/...`): `FIREBASE_ADMIN_*` (read at run time by the Admin SDK).
- **The public values and the admin values of one Vercel project must belong to the same Firebase project.**

---

## 2. Requirements and costs

### Accounts and permissions

| Where | You need | Why |
|---|---|---|
| GitHub | Admin rights on the repo | branch rulesets, Actions secrets |
| Firebase / Google Cloud | Owner (or Editor + Service Account Key Admin) on each project | create apps, service-account keys, rules |
| Vercel | Owner of the team/account | create projects, set variables, change production branch |
| Authenticator app | Your own | Vercel asks for a 6-digit code before revealing or editing secret values |
| Password manager | Strongly advised | service-account JSON files, recovery codes |

### Tools and versions

| Tool | Version | Notes |
|---|---|---|
| Node.js | **22 or newer** (`>=22 <25`) | `firebase-admin` 14 requires 22+. On Node 20 npm silently skips one of its optional dependencies and the build fails later. |
| npm | 10 or newer | the repo uses npm only (`package-lock.json`) |
| Java | 21 | only for the Firestore emulator used by the rules tests (CI installs it itself) |
| Git | any recent | |
| Optional | `firebase-tools`, `gh` (GitHub CLI), `vercel` CLI | handy, never required: everything can be done in the web consoles |

### Costs and limits to know

| Service | Free tier reality |
|---|---|
| Firebase Spark | Free, but exceeding a daily quota **stops** that service until the daily reset. |
| Firebase Blaze | Same free allowance, but you need a billing account and usage above it is charged. Recommended for production. Firestore's no-cost allowance is roughly 50k reads, 20k writes and 20k deletes per day per project. Check the current numbers under Firestore, Usage. |
| Vercel Hobby | Intended for personal, non-commercial use (check Vercel's current terms). Builds run **one at a time** across your account, so two projects building the same push queue behind each other. Custom environments and more concurrent builds need Pro. |
| GitHub Actions | Generous free minutes; the CI here takes about 2 minutes per run. |

---

## 3. Choose your layout (the options)

Pick once, then follow Sections 4 to 9. The default (Option A) is what this guide's commands assume.

### 3.1 How many environments?

| Option | When to use | What changes |
|---|---|---|
| **A. Test + Production (recommended)** | Almost every real app | Two Firebase projects, two Vercel projects, branches `dev` and `main`. |
| B. Production only | A throwaway or personal tool | One of everything. You test on production, so keep rules strict and take backups. Skip all "test" steps. |
| C. Dev + Staging + Production | Teams, regulated or high-risk apps | Three Firebase projects. Vercel Pro custom environments, or three Vercel projects. Add a `staging` branch and extend the `deploy-rules.yml` expression. |
| D. Several apps | A product family | Repeat the whole set per app; keep one GitHub repo per app. |
| E. Monorepo | App lives in a subfolder | In each Vercel project set **Root Directory** to the subfolder; point workflows at it with `working-directory`. |

### 3.2 Branch strategy

| Strategy | Notes |
|---|---|
| **`dev` to `main` (recommended)** | `dev` is the staging branch (test site), `main` is production. Promotion is a pull request. |
| Trunk-based (only `main`) | Every merge goes live. Use feature flags and rely on previews. Then use Option B or test with Vercel previews pointing at a test Firebase project (see 3.3). |
| Release branches | Add `release/*` to the `on:` lists of the workflows and to the ruleset. |

### 3.3 What should preview (per-branch) deployments use?

Vercel builds a preview for every branch and pull request. Decide which Firebase project they talk to:

| Choice | How |
|---|---|
| **Test project for everything except production (recommended)** | In the **prod** Vercel project, give the Preview scope its own variables pointing at the test Firebase project, or turn previews off (3.4). In the **test** Vercel project, "Production" is the `dev` branch, so previews are rarely used. |
| Previews disabled | Use the Ignored Build Step (Section 13.3). Simplest and cheapest. |
| Previews use prod values | **Avoid.** A preview would read and write production data. Vercel applies variables per scope; check the Preview scope of every variable. |

Note: in this layout the prod project's variables are usually set to **Production only** for the secret ones, so a preview there has no admin credentials and its API routes fail safely.

### 3.4 Registration policy for the app

The app's `/register` endpoint creates a new owner account and a private tenant. Decide:

| Policy | Setting |
|---|---|
| Invite-only (staff are added by the owner inside the app) | `NEXT_PUBLIC_ALLOW_REGISTRATION=false` after the owner exists |
| Open sign-up (anyone can create their own clinic) | keep `true`, and add email verification or CAPTCHA before going public |

---

## 4. Step 1: prepare the code

Everything below already exists in this repo; the appendices contain full copies so you can recreate it elsewhere.

1. **Node version.** In `package.json` set `"engines": { "node": ">=22 <25" }`. In CI use `node-version: 22`. (Appendix F)
2. **Scripts** the pipeline calls (Appendix F):
   - `typecheck`: `next typegen && tsc --noEmit` (Next 15.5 generates route types that `tsc` needs).
   - `lint`, `build`, `test:rules`.
3. **`overrides`** in `package.json` (Appendix F). They fix real problems found during setup:
   - `jwks-rsa` pinned to 3.x so server routes work on Vercel's runtime (see Troubleshooting, ERR_REQUIRE_ESM).
   - `@grpc/grpc-js` and `postcss` pinned to patched versions to clear security advisories.
4. **Firebase client init must not crash the build** when a variable is missing. Use a placeholder `apiKey` fallback (Appendix G).
5. **Config files:** `vercel.json` (Appendix D), `firebase.json` and `.firebaserc` (Appendix E).
6. **`.gitignore`** must ignore env files, service-account keys and generated files such as `next-env.d.ts` (Appendix H).
7. **Workflows:** `.github/workflows/ci.yml` (Appendix A), `.github/workflows/deploy-rules.yml` (Appendix B) and `scripts/deploy-firestore-rules.ts` (Appendix C).
8. **Rules tests** (recommended): `firestore.rules` plus emulator tests, run by `npm run test:rules`. CI refuses to merge broken rules.
9. Confirm locally before pushing: `npm ci && npm run typecheck && npm run lint && npm run test:rules && npm run build`.

Windows notes: use `npm.cmd` / `npx.cmd` in PowerShell (execution-policy errors otherwise). If a previous run left a Java emulator behind, the rules runner script kills it. Git may warn about CRLF; it is harmless.

---

## 5. Step 2: GitHub

1. **Create the repository** and push `main`. Create the staging branch:
   ```bash
   git checkout -b dev
   git push -u origin dev
   ```
2. **Run CI once** (push anything to `dev`) so the check named `verify` exists; it is needed in step 4.
3. **Protect `main`**: Settings, Rules, Rulesets, **New branch ruleset**:
   - Name: `Protect main`. Enforcement status: **Active**.
   - Target branches: **Include default branch**.
   - Tick **Require a pull request before merging** (0 required approvals is fine for a one-person repo; raise it for teams).
   - Tick **Require status checks to pass**, click **Add checks**, search `verify`, select it.
   - Keep **Block force pushes** ticked.
   - Optionally also protect `dev` (same ruleset, or without the PR requirement).
4. **Secrets**: leave empty for now; Step 6 adds the two for rules deploys. CI itself needs none.
5. **Collaborators/teams**: Settings, Collaborators. Give least privilege (Write for developers, Admin only for maintainers).
6. **Optional**: turn on Dependabot alerts and secret scanning if your plan offers them (Settings, Code security).

Why a ruleset (and not classic branch protection)? Rulesets are the current feature, show clear status, and can bypass-list specific roles. Classic protection works equally well if you prefer it.

---

## 6. Step 3: Firebase (once per environment)

Do this for `<test-project-id>`, then again for `<prod-project-id>`.

1. **Create the project**: Firebase console, Add project. Choose a clear name (`<app>-test`, `<app>-prod`). Google Analytics is optional.
2. **Plan**: for production, upgrade to **Blaze** (Usage and billing). Set a budget alert in Google Cloud Billing so a bug cannot surprise you.
3. **Authentication**: Build, Authentication, Get started, Sign-in method, enable **Email/Password**.
4. **Firestore**: Build, Firestore Database, Create database, **production mode**, pick the region nearest your users. **The region cannot be changed later.** Write it down; set the Vercel function region near it (Section 7.4).
5. **Register a web app**: Project settings (gear), General, Your apps, **Add app**, Web (`</>`). Give it a nickname. Skip Firebase Hosting.
   Open the app's **Config** snippet. You will need exactly these six values for Vercel:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
   (ignore `measurementId`).
6. **Service-account keys**: Project settings, **Service accounts**, **Generate new private key**.
   Create **two** keys per project, name them in your password manager as `vercel` and `github-actions`.
   - A downloaded JSON contains `project_id`, `client_email` and `private_key`. Treat it like a password.
   - If key creation is blocked, an organisation policy forbids it; ask a Google Cloud org admin, or use the keyless option in Section 13.5.
   - Delete the downloaded files after you have stored the values.
7. **Publish the first rules** (before the app serves traffic). Either of:
   ```bash
   # with the repo's script and the service-account JSON in an environment variable
   FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" npx tsx scripts/deploy-firestore-rules.ts --project <project-id>
   # or with the Firebase CLI after `firebase login`
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <project-id>
   ```
   Never leave "test mode" rules (`allow read, write: if true` or `if request.auth != null` on everything) on a project with real users. Keep the repo's `firestore.rules` as the single source of truth and run its tests.
8. **Authorised domains** (Authentication, Settings): add the Vercel hostname(s) after Step 4 creates them (Section 8). Entries are exact hostnames; wildcards are not supported.
9. **Recommended for production**: Firestore, Disaster recovery, enable point-in-time recovery and a scheduled backup. Consider enabling App Check later.
10. **Per-project record** (keep in your own notes, not in Git): project id, region, plan, owner emails, which key is used where.

---

## 7. Step 4: Vercel (once per environment)

Create **two** Vercel projects from the **same** GitHub repository.

### 7.1 Create the project

1. Vercel, Add New, Project, **Import** the repository (install the Vercel GitHub app for that repo if asked).
2. Name it `<app>-test` (first) or `<app>-prod`. Framework: Next.js. Root Directory: `./` (or your subfolder for a monorepo).
3. You can click **Deploy** immediately. The first build may fail until variables exist; that is fine.
4. Repeat for the other environment with a different project name.

### 7.2 Production branch

Settings, **Environments**, **Production**, Branch Tracking:

| Project | Production branch |
|---|---|
| `<app>-prod` | `main` (default) |
| `<app>-test` | change to `dev`, then **Save** |

Result: every push to `dev` becomes the test project's production deployment; every push to `main` becomes the prod project's.

### 7.3 Build settings and Node

The repo's `vercel.json` already sets `npm ci --legacy-peer-deps`, `npm run build`, a function region and a 30 s API timeout (Appendix D).
Remove `--legacy-peer-deps` if your own dependency tree resolves without it.
Settings, Build and Deployment, **Node.js Version**: choose 22.x or 24.x.

### 7.4 Function region

Builds always run in one region (shown at the top of the build log). Serverless functions run where `vercel.json` says:

```json
"regions": ["<region-nearest-your-firestore>"]
```

Examples: `bom1` Mumbai, `sin1` Singapore, `fra1` Frankfurt, `iad1` US East. A server on another continent from Firestore adds 100 to 400 ms to every API call.

### 7.5 Environment variables

Settings, Environment Variables. Add each variable **in each project, with that project's own Firebase values**.

| Variable | Value | Vercel type | Scopes |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | web config `apiKey` | Config | Production (and Preview if used) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` | Config | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | Config | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` | Config | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | Config | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` | Config | same |
| `FIREBASE_ADMIN_PROJECT_ID` | service-account `project_id` | **Secret** | Production only |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | service-account `client_email` | **Secret** | Production only |
| `FIREBASE_ADMIN_PRIVATE_KEY` | service-account `private_key` | **Secret** | Production only |
| `NEXT_PUBLIC_ALLOW_REGISTRATION` | `true` until the owner exists, then `false` | Config | same as the public set |

How to enter them quickly: **Add Environment Variable, Import .env**, then choose the file or paste the text.
The dialog applies **one type to every row**, so do it in two passes:

1. Pass 1, type **Config**: the six `NEXT_PUBLIC_FIREBASE_*` plus `NEXT_PUBLIC_ALLOW_REGISTRATION`. Delete the three admin rows from the dialog first.
2. Pass 2, type **Secret**: only the three `FIREBASE_ADMIN_*` rows. Delete the public rows first.

Rules of thumb:

- `NEXT_PUBLIC_*` variables are shipped to browsers, so Vercel will not accept them as Secret (rows turn red). This is expected; they are identifiers.
- **Preview scope:** if a public variable is ticked for Preview in the prod project, previews of that project read production data. Either untick Preview, add the same variable again with only the Preview scope and the **test** project's value, or disable previews (Section 13.3).
- For `FIREBASE_ADMIN_PRIVATE_KEY`, keep it on **one line** with the literal `\n` sequences exactly as in the JSON, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines. Do not turn `\n` into real line breaks.
- Editing or revealing a Secret asks for your authenticator code. Only you can enter it.
- **A variable change only applies to the next deployment.** After editing: Deployments, latest, `...`, **Redeploy**, leave "Use existing Build Cache" **unticked**.
- Redeploy rebuilds the **same commit**. To ship new code, push a new commit.
- A `.env` file you create for the import must live outside the repo and be deleted afterwards (Appendix H ignores `*.env` as a safety net).

### 7.6 Other Vercel settings worth a look

- **Git**: confirm the connected repository; leave "Pull Request Comments" on if you like the deploy links in PRs.
- **Deployment Protection**: decide whether previews should require Vercel login or a password. Production is normally public.
- **Domains**: add a custom domain (Section 11.3) and note the default `*.vercel.app` hostname.
- **Ignored Build Step**: see Section 13.3 to stop both projects building every push.

---

## 8. Step 5: connect everything and verify

### 8.1 Authorise the domain in Firebase

For each environment: Firebase console, Authentication, Settings, **Authorised domains**, Add domain, enter the Vercel hostname (for example `<app>-test.vercel.app`). Add custom domains too. Without this, sign-in fails with `auth/unauthorized-domain`.

### 8.2 Redeploy and wait for "Ready"

After variables are saved, push a commit or Redeploy. Open the deployment's build log. A healthy log ends with the route table and "Compiled successfully". Warnings about unused variables or deprecated packages do not fail the build; errors do.

### 8.3 Wiring check (prove each site talks to its own Firebase project)

Open the deployed site, open the browser console (F12), paste (Appendix J has this again):

```js
const urls=[...new Set(performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.includes('/_next/static/')&&u.endsWith('.js')))];
const hits={};
for(const u of urls){ const t=await (await fetch(u)).text();
  for(const p of ['<test-project-id>','<prod-project-id>','missing-api-key']) if(t.includes(p)) hits[p]=(hits[p]||0)+1 }
hits
```

Expected: only **this** environment's project id. A hit for the other environment means the public variables are wrong (the classic mistake: the test site given production values). `missing-api-key` means the API-key variable is empty.

### 8.4 Server smoke test

In the same console:

```js
(await fetch('/api/auth/logout',{method:'POST'})).status   // expect 200
(await fetch('/api/auth/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:'x'})})).status  // expect 401
```

`500` means the Admin SDK failed to load or the admin variables are wrong. Read Vercel, project, **Logs** (filter Error) for the exact message and use Section 14.

### 8.5 First real use

1. Open `/register` and create the owner account (or sign in if it exists).
2. Click through every sidebar page; add and delete one record; reload to confirm it persisted.
3. Check Firestore (Firebase console, Data) that the documents appeared in the **right project**.
4. Test with a second browser profile signed out: protected pages must redirect to login.

### 8.6 Close registration (invite-only apps)

When the owner account works: set `NEXT_PUBLIC_ALLOW_REGISTRATION=false` in the prod project and **redeploy**. Then `/register` should refuse new accounts. Add staff from inside the app (Settings, Users). Keep it `true` on the test project if you want to create throwaway accounts there.

---

## 9. Step 6: automatic Firestore rules deploys

`deploy-rules.yml` publishes `firestore.rules` after a change is merged: pushes to `dev` publish to the test project, pushes to `main` publish to the prod project.

1. Edit the workflow (Appendix B): replace `<prod-project-id>` and `<test-project-id>` in the `PROJECT_ID` line. Also set `.firebaserc` default to the test project (Appendix E).
2. In GitHub: Settings, Secrets and variables, Actions, **New repository secret**:
   | Secret name | Value |
   |---|---|
   | `FIREBASE_SERVICE_ACCOUNT_TEST` | the entire JSON of the `github-actions` key for the test project |
   | `FIREBASE_SERVICE_ACCOUNT_PROD` | the entire JSON of the `github-actions` key for the prod project |
   Paste from the opening `{` to the closing `}`. GitHub never shows a secret again after saving; to change it, save a new value.
3. Trigger the first run: push any change to `firestore.rules` (even a comment) on `dev`, or use **Actions, Deploy Firestore rules, Run workflow** (the button appears once the workflow exists on the default branch).
4. Check the run: steps "Check credentials (dry run)" and "Publish rules" should both be green. Confirm in Firebase console, Firestore, **Rules**: the newest version shows today's date.

Safety built into the script (Appendix C):

- It refuses to run if the key's `project_id` differs from `--project`, so a swapped secret cannot publish to the wrong project.
- It checks the file looks like Firestore rules before sending it.
- With no secret configured the workflow only prints a warning and does nothing.
- The dry run proves the credentials can read rules; the real publish proves they can write them.

What it does not do: publish Firestore **indexes** (the Admin SDK has no index API). If you later need composite indexes, add a step using `firebase-tools` (Section 13.2).

---

## 10. Daily workflow, releases, hotfixes, rollbacks

### 10.1 Normal change

```
git checkout dev && git pull
git checkout -b feature/<name>
# ... code, commit ...
git push -u origin feature/<name>        # open a PR into dev
```

1. PR into `dev`: wait for **verify** to go green, merge. The test site (and, if configured, rules) update automatically.
2. Check the test site (run the wiring check once if variables changed).
3. PR **`dev` into `main`**: green **verify**, merge. Production deploys automatically; a rules change publishes to prod.
4. Keep `dev` and `main` aligned after merging: `git checkout dev && git pull && git merge --ff-only origin/main && git push` (so the next PR shows only new work).

### 10.2 Environment variable change

Edit the variable in the right Vercel project, then Redeploy that project (build cache unticked). If it is a `NEXT_PUBLIC_*` variable the browser bundle changes, so run the wiring check afterwards.

### 10.3 Hotfix

Branch from `main`, fix, PR into `main`, merge (CI gates it), then merge `main` back into `dev`.

### 10.4 Rollbacks

| What broke | Rollback |
|---|---|
| A bad site deploy | Vercel, Deployments, pick the last good production deployment, `...`, **Promote to Production** (or Instant Rollback). Fix forward in Git afterwards. |
| A bad commit | `git revert <sha>` on a branch and PR it. Avoid force pushes (they are blocked on `main`). |
| Bad Firestore rules | Firebase console, Firestore, Rules: the history lists earlier versions; open one and **Publish** it. Then revert the commit so Git and the console agree. |
| Bad variable | Edit it back and Redeploy. |

### 10.5 Seeing what is live

- Vercel project, **Deployments**: Production badge, commit, branch and status.
- GitHub, Actions: CI and Deploy rules runs per commit.
- Firebase console, Firestore, Rules: publish time of the current rules.

---

## 11. Operations: keys, people, domains, backups, monitoring

### 11.1 Rotate a service-account key (do this on a schedule, and immediately after any exposure)

1. Firebase console, Project settings, Service accounts, **Generate new private key**.
2. Put the new values where the old key was used: Vercel (`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, secret edit needs your authenticator code) and/or the GitHub secret.
3. Redeploy; sign in; run the smoke test (Section 8.4).
4. **Only then** delete the old key: Google Cloud console, IAM and Admin, Service accounts, the `firebase-adminsdk-...` account, **Keys** tab, delete the older key rows. Keep exactly the one(s) still in use.
5. Delete downloaded JSON files and any temporary `.env` files, including from the Recycle Bin.
6. If a key ever appeared in a screenshot, chat, ticket or commit, treat it as compromised: rotate right away and delete the old key even if "nothing seems wrong".

To tell keys apart: the Keys tab shows a **Key ID** and creation date; the matching JSON file has the same value in `private_key_id`.

### 11.2 People and access

| System | Add a teammate | Least privilege |
|---|---|---|
| GitHub | Settings, Collaborators | Write for developers; Admin for maintainers only |
| Vercel | Team settings, Members | Member/Developer; Owner only for the person who can change billing and variables |
| Firebase / Google Cloud | Project settings, Users and permissions (IAM) | Viewer or Editor; Owner sparingly. Developers rarely need the service-account keys. |
| The app itself | Owner adds staff in the app (Settings, Users) | Role `staff` vs `super_admin` |

Offboarding: remove the person from all four, rotate any key they could read.

### 11.3 Custom domain

1. Vercel, project, Domains, Add; follow the DNS instructions it shows.
2. Add the domain to Firebase Authentication, Authorised domains.
3. If the OAuth/auth domain changes, re-run the wiring check and a real sign-in.

### 11.4 Backups and recovery

- Firestore, Disaster recovery: enable **point-in-time recovery** (recent restore) and a **scheduled backup** (daily, a week or more of retention) on production.
- Git is your code backup; the rules are in Git; variables are not, so keep a private record of which variable has which value source (not the values themselves).

### 11.5 Monitoring

| Signal | Where |
|---|---|
| Runtime errors | Vercel, project, **Logs**, filter Error and Fatal |
| Build failures | Vercel, Deployments (red Error row) and GitHub Actions |
| Quota / cost | Firebase, Firestore, **Usage**; Google Cloud Billing budget alerts |
| Uptime | A free external uptime check on your production URL, or Vercel alerts if available on your plan |
| Rules denials | Firestore, Usage, rules metrics (a spike means a client is being refused) |

### 11.6 Dependencies and security patches

- Watch build logs for deprecation and vulnerability notices.
- Run `npm audit --omit=dev` regularly; fix what reaches production (upgrade `next` and `firebase*` first).
- When a patched transitive version exists but its parent has not moved, use `overrides` in `package.json` (as done for `jwks-rsa`, `@grpc/grpc-js`, `postcss`). Re-test after each override: run typecheck, lint, rules tests, a build and the smoke test.

---

## 12. Security checklist

- [ ] No secret in Git: `.env*` (except an example file), `*.env`, `*service-account*.json`, `*adminsdk*.json`, `*.pem` are ignored (Appendix H). Search history if unsure.
- [ ] Separate Firebase projects for test and prod; the wiring check passes on both.
- [ ] Separate service-account key per consumer (Vercel, GitHub); old and exposed keys deleted.
- [ ] Firestore rules are deny-by-default, tenant- and role-aware, covered by emulator tests, and published only through the pipeline.
- [ ] `main` is protected: PR required, `verify` required, force pushes blocked.
- [ ] Registration closed on production unless open sign-up is intended.
- [ ] Vercel and GitHub accounts use two-factor authentication; recovery codes stored safely.
- [ ] Admin variables are Secret and scoped to Production only; previews cannot reach production credentials.
- [ ] Firebase Authentication password policy and email templates reviewed; Authorised domains contain only domains you own.
- [ ] Security headers/CSP reviewed (the app sets them in `next.config`; Firebase Auth needs its Google script and frame sources allowed).
- [ ] Backups enabled on production; budget alert set.
- [ ] Optional hardening: GitHub **Environments** with required reviewers for the production deploy; keyless Google auth instead of JSON keys (Section 13.5).

---

## 13. Variations and possibilities

### 13.1 Deploy rules with the Firebase CLI instead of the script

Replace the two script steps in `deploy-rules.yml` with:

```yaml
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ env.FIREBASE_SERVICE_ACCOUNT }}
      - run: npx firebase-tools deploy --only firestore:rules --project "$PROJECT_ID"
```

The script in this guide avoids the CLI, needs no extra action and has the project-mismatch guard, which is why it is the default.

### 13.2 Also deploy Firestore indexes

Add a step with `firebase-tools` (it needs a role that can manage indexes, for example Cloud Datastore Index Admin, on the key's service account):

```yaml
      - run: npx firebase-tools deploy --only firestore:indexes --project "$PROJECT_ID"
```

Keep `firestore.indexes.json` in the repo. Apps whose queries use one `orderBy` or equality filters on one field need no composite indexes.

### 13.3 Stop both Vercel projects building every push (Ignored Build Step)

Because both projects watch the same repo, a push to `dev` builds in both, and a Hobby account builds one project at a time (so builds queue). Fix it per project in Settings, Build and Deployment, **Ignored Build Step**, Behavior: Custom:

```bash
# prod project: build only main
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && exit 1 || exit 0
# test project: build only dev
[ "$VERCEL_GIT_COMMIT_REF" = "dev" ] && exit 1 || exit 0
```

Exit code `1` means "go ahead and build", `0` means "skip". Trade-off: no preview deployments for feature branches. Do not make a Vercel check a **required** status if you skip builds.

### 13.4 End-to-end browser tests

- Keep them off the default CI path: they consume Firestore reads and need real credentials.
- If you add them, run them against the **test** project only, with a dedicated test user (secrets `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`), on a nightly `schedule:` or on demand (`workflow_dispatch`), never on every push.
- The app's Playwright setup signs in once and stores `storageState` including IndexedDB (Firebase keeps auth there).

### 13.5 Keyless authentication for GitHub Actions (no JSON keys)

Instead of storing a service-account JSON as a GitHub secret, use **Workload Identity Federation** with `google-github-actions/auth`. You create a pool and provider in Google Cloud, allow your repository and branch to impersonate a service account, and the job gets short-lived credentials. More secure, more setup. Worth it for teams or regulated apps. The rules script then reads Application Default Credentials instead of `FIREBASE_SERVICE_ACCOUNT` (a small change in Appendix C).

### 13.6 Approvals before production deploys

Create a GitHub **Environment** called `production`, add required reviewers, move the prod secret into that environment, and add `environment: production` to the job for `main`. Rules then publish to prod only after someone approves in GitHub. Vercel production deploys can be gated by merge rules (the ruleset above) or Vercel's own protection settings.

### 13.7 More environments

Add a `staging` Firebase project and branch, extend the `PROJECT_ID`/secret expressions in `deploy-rules.yml` (a small `case` shell step is clearer than nested `&&`/`||`), add a Vercel project (or a Pro custom environment), and add the branch to `ci.yml` and the ruleset.

### 13.8 Different Firebase products

This app uses Authentication and Firestore only. For Storage, Functions or Hosting add their own deploy steps and rules (`storage.rules`) and extend the key's roles accordingly. The environment model does not change.

### 13.9 Local development

- Copy `.env.example` to `.env.local` and fill it with the **test** project values (never production). `.env.local` is git-ignored.
- `npm run dev` serves on port 3000 (or the next free port). Do not run a production build into the same `.next` folder a dev server uses; build into another folder with `NEXT_DIST_DIR`.
- For rules work use the emulator (`npm run test:rules`), which needs Java.

---

## 14. Troubleshooting

"Seen" means it actually happened while building this setup.

### Build and CI

| Symptom | Cause | Fix |
|---|---|---|
| Vercel build fails with `auth/invalid-api-key` while prerendering (seen) | The API-key variable is empty at build time | Set the six public variables; keep the placeholder fallback in the client init (Appendix G) so a missing value fails at sign-in, not at build |
| CI fails `Cannot find module '@google-cloud/firestore'` (seen) | `firebase-admin` 14 needs Node 22; Node 20 silently skips its optional dependency | CI `node-version: 22`, `engines: ">=22 <25"` |
| CI type check fails on `.next/types/routes.d.ts` or similar (seen) | Next 15.5 references generated route types | `typecheck` = `next typegen && tsc --noEmit`; ignore `next-env.d.ts` |
| CI type check fails `Parameter 'x' implicitly has an 'any' type` only in CI (seen) | Loose types resolve differently on a clean install | Annotate the parameter explicitly |
| `npm ci` complains the lockfile is out of sync | `package.json` and `package-lock.json` disagree (often after editing `overrides`) | Run `npm install` locally and commit both files |
| `npm install` error `EOVERRIDE ... conflicts with direct dependency` (seen) | An override for a package that is also a direct dependency | Use the `"$packageName"` reference form, e.g. `"postcss": "$postcss"` |
| Rules tests fail to start: port taken (Windows) | A previous emulator Java process survived | The rules runner kills it; otherwise end the `java` process using the port in `firebase.json` |
| Merge button disabled on a PR | Required check `verify` is still running or failed | Wait, or open the run log, fix, push |
| "Run workflow" button missing | `workflow_dispatch` appears only for workflows on the default branch | Merge the workflow into `main`, or trigger it by pushing a change to a watched path |

### Runtime and authentication

| Symptom | Cause | Fix |
|---|---|---|
| Every `/api/*` route returns 500; Vercel log `require() of ES Module ... jose ... from jwks-rsa` (`ERR_REQUIRE_ESM`) (seen) | Vercel's Node runtime rejects `require()` of ES modules; `jwks-rsa` 4 needs ESM-only `jose` 6 | `overrides: { "jwks-rsa": "3.2.2" }`. Test locally with `NODE_OPTIONS=--no-experimental-require-module` |
| Create account shows "Invalid email or password" (seen) | The public config and the admin key point at different Firebase projects: the server created the user in one, the browser signed in against the other | Make both belong to the same project, redeploy, run the wiring check |
| Test site shows or writes production data (seen) | The test Vercel project was given the prod public variables | Correct the six public variables, redeploy, wiring check |
| Sign-in fails with `auth/unauthorized-domain` | The deployed hostname is not in Authorised domains | Add the exact hostname (no wildcards) |
| Sign-in fails right after a key change | The Vercel secret was pasted with real line breaks or truncated | Re-paste on one line with literal `\n`; redeploy |
| "Quota exceeded" at sign-in (seen once) | A daily Firestore or Identity quota was exhausted after heavy automated testing; the exact quota was not pinned down | Check Firestore, Usage and Google Cloud, IAM, Quotas; wait for the daily reset (about midnight Pacific); enable Blaze; avoid repeated full e2e runs |
| 401/403 from Firestore for a valid user | Rules deny the user (missing profile, inactive user, wrong tenant) | Check the user's profile document and the rules tests; read rules metrics |
| Registration form still works after setting the flag to `false` | The new value was not deployed | Redeploy the prod project; confirm the variable scope includes Production |

### Vercel and GitHub behaviour

| Symptom | Cause | Fix |
|---|---|---|
| Changed a variable, nothing changed (seen) | Variables apply only to new deployments | Redeploy with cache unticked |
| "Redeploy" served old code (seen) | Redeploy rebuilds the **same commit** | Push a new commit, or redeploy the deployment built from the commit you want |
| Builds sit in "Queued" (seen) | Hobby plan builds one project at a time; a push builds in both projects | Wait, apply the Ignored Build Step (13.3), or upgrade |
| Vercel asks for a 6-digit code when editing a Secret (seen) | 2FA protects revealing secrets | Enter your own authenticator code; nobody else can |
| Import .env rows turn red in Secret mode (seen) | `NEXT_PUBLIC_*` cannot be Secret | Import public values as Config, admin values as Secret, in two passes |
| Deploy-rules run is green but nothing published | No secret set: the workflow only warned | Add the secrets (Section 9) and re-run |
| Deploy-rules says "Refusing to deploy: Service account belongs to project X" | Wrong secret in the wrong environment | Put the matching project's JSON in each secret |
| Rules published to the wrong project | `PROJECT_ID` line in the workflow still has the original ids | Edit it to your own project ids |

### Last resort checks

1. Read the **first** error in the build log (use the log's error filter), not the last line.
2. Vercel, Logs, Error filter, expand the row for the full stack message.
3. Reproduce locally: `npm ci && npm run typecheck && npm run lint && npm run build`, then `npx next start` and call the failing route.

---

## 15. Final checklist for a new project pair

GitHub
- [ ] Repo with `main` and `dev`; CI has run once
- [ ] Ruleset on `main`: PR required, check `verify` required, force pushes blocked
- [ ] Two secrets saved: `FIREBASE_SERVICE_ACCOUNT_TEST`, `FIREBASE_SERVICE_ACCOUNT_PROD`

Firebase (each project)
- [ ] Email/Password enabled; Firestore created in the chosen region; web app registered
- [ ] Rules published (tests green first); no test-mode rules
- [ ] Authorised domains contain the Vercel hostname(s) and custom domain(s)
- [ ] Separate service-account keys for Vercel and for GitHub
- [ ] Production: Blaze plan, budget alert, backups enabled

Vercel (each project)
- [ ] Imported from the same repo; production branch `dev` (test) / `main` (prod)
- [ ] Function region set near Firestore; Node 22.x or 24.x
- [ ] Six public variables (Config) and three admin variables (Secret, Production only) from **this** environment's Firebase project
- [ ] Redeployed after the last variable change; build log is green

Verification
- [ ] Wiring check shows only this environment's project id on both sites
- [ ] `/api/auth/logout` returns 200 and a bad token on `/api/auth/session` returns 401 on both sites
- [ ] Owner account created; pages load; a record can be added, reloaded and deleted
- [ ] `NEXT_PUBLIC_ALLOW_REGISTRATION=false` on production (invite-only apps), redeployed
- [ ] A change to `firestore.rules` on `dev` publishes to test; on `main` publishes to prod

Hygiene
- [ ] Old or exposed keys deleted in Google Cloud, IAM, Service accounts, Keys
- [ ] Downloaded JSON files and temporary `.env` files deleted
- [ ] Private note kept of which key and variable belongs where (no values)

---

# Appendices

Everything below is copy-paste ready. Replace only the `<placeholders>`.

## Appendix A: `ci.yml`

`.github/workflows/ci.yml`. Needs no secrets; dummy Firebase values let the build run.

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      # Dummy values: the build must not need real secrets.
      NEXT_PUBLIC_FIREBASE_API_KEY: ci-placeholder
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ci-placeholder.firebaseapp.com
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: ci-placeholder
      NEXT_PUBLIC_FIREBASE_APP_ID: 1:0:web:0
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - uses: actions/setup-java@v4          # Firestore emulator for the rules tests
        with:
          distribution: temurin
          java-version: 21
      - run: npm ci --legacy-peer-deps       # drop the flag if your tree installs without it
      - name: Type check
        run: npm run typecheck
      - name: Lint
        run: npm run lint
      - name: Firestore rules tests (emulator)
        run: npm run test:rules
      - name: Production build
        run: npm run build
```

The job name `verify` is what the branch ruleset requires. Rename both together if you change it.

## Appendix B: `deploy-rules.yml`

`.github/workflows/deploy-rules.yml`. Edit the two project ids.

```yaml
name: Deploy Firestore rules

# Publishes firestore.rules after a merge: dev -> test project, main -> prod project.
# Secrets are service-account JSON keys; the script refuses a key from a different project.
on:
  push:
    branches: [main, dev]
    paths:
      - firestore.rules
      - scripts/deploy-firestore-rules.ts
      - .github/workflows/deploy-rules.yml
  workflow_dispatch:

concurrency:
  group: deploy-rules-${{ github.ref }}
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    # Secrets (Settings -> Secrets and variables -> Actions):
    #   FIREBASE_SERVICE_ACCOUNT_TEST   service-account JSON of <test-project-id>
    #   FIREBASE_SERVICE_ACCOUNT_PROD   service-account JSON of <prod-project-id>
    env:
      PROJECT_ID: ${{ github.ref_name == 'main' && '<prod-project-id>' || '<test-project-id>' }}
      FIREBASE_SERVICE_ACCOUNT: ${{ github.ref_name == 'main' && secrets.FIREBASE_SERVICE_ACCOUNT_PROD || secrets.FIREBASE_SERVICE_ACCOUNT_TEST }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci --legacy-peer-deps
      - name: Skip notice
        if: env.FIREBASE_SERVICE_ACCOUNT == ''
        run: echo "::warning::No service-account secret for this branch yet; rules were NOT published."
      - name: Check credentials (dry run)
        if: env.FIREBASE_SERVICE_ACCOUNT != ''
        run: npx tsx scripts/deploy-firestore-rules.ts --project "$PROJECT_ID" --dry-run
      - name: Publish rules
        if: env.FIREBASE_SERVICE_ACCOUNT != ''
        run: npx tsx scripts/deploy-firestore-rules.ts --project "$PROJECT_ID"
```

## Appendix C: `scripts/deploy-firestore-rules.ts`

Needs `firebase-admin` (already a dependency) and `tsx` (dev dependency).

```ts
#!/usr/bin/env npx tsx
/**
 * Publish firestore.rules to a Firebase project using a service account (Admin SDK).
 * Credentials come from ONE environment variable holding the service-account JSON:
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", ...}'
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=... npx tsx scripts/deploy-firestore-rules.ts --project <project-id>
 *   Add --dry-run to validate the credentials and the rules file without publishing.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getSecurityRules } from 'firebase-admin/security-rules'

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function main() {
  const projectId = readArg('--project')
  const dryRun = process.argv.includes('--dry-run')
  const rulesPath = resolve(readArg('--rules') ?? 'firestore.rules')
  const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT

  if (!projectId) throw new Error('--project <firebase project id> is required.')
  if (!rawAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set.')

  let account: { project_id?: string; client_email?: string; private_key?: string }
  try {
    account = JSON.parse(rawAccount)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  }
  // Guard against deploying with the wrong environment's key.
  if (account.project_id !== projectId) {
    throw new Error(
      `Service account belongs to project "${account.project_id}", but --project is "${projectId}". Refusing to deploy.`
    )
  }

  const source = readFileSync(rulesPath, 'utf8')
  if (!source.includes('service cloud.firestore')) {
    throw new Error(`${rulesPath} does not look like a Firestore rules file.`)
  }

  console.log(`Project: ${projectId}`)
  console.log(`Rules:   ${rulesPath} (${source.length} bytes)`)

  const app = initializeApp({ credential: cert(account as Parameters<typeof cert>[0]), projectId })
  const rules = getSecurityRules(app)

  if (dryRun) {
    // Validates the credentials: this creates no release.
    await rules.getFirestoreRuleset()
    console.log('Dry run OK: credentials work. Nothing was published.')
    return
  }

  const ruleset = await rules.releaseFirestoreRulesetFromSource(source)
  console.log(`Published ruleset ${ruleset.name} at ${ruleset.createTime}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
```

## Appendix D: `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm ci --legacy-peer-deps",
  "buildCommand": "npm run build",
  "regions": ["<region-nearest-your-firestore>"],
  "functions": {
    "src/app/api/**/*.ts": { "maxDuration": 30 }
  }
}
```

## Appendix E: `firebase.json` and `.firebaserc`

`firebase.json` (rules file, index file, and emulator ports used by the rules tests):

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8085 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

`.firebaserc` (the default project used by CLI commands; point it at the **test** project so a careless command never hits production):

```json
{
  "projects": {
    "default": "<test-project-id>"
  }
}
```

Minimal `firestore.indexes.json` when you need no composite indexes:

```json
{ "indexes": [], "fieldOverrides": [] }
```

## Appendix F: `package.json` fragments

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "next typegen && tsc --noEmit",
    "test:rules": "node scripts/test-rules.mjs",
    "verify": "npm run typecheck && npm run lint && npm run test:rules && npm run build",
    "firebase:deploy:rules": "firebase deploy --only firestore:rules,firestore:indexes"
  },
  "engines": { "node": ">=22 <25" },
  "overrides": {
    "jwks-rsa": "3.2.2",
    "@grpc/grpc-js": "^1.14.6",
    "postcss": "$postcss"
  }
}
```

Notes: the `overrides` are the ones this app needed; re-check them (`npm audit --omit=dev`) when you upgrade `firebase-admin` or `next`. `"postcss": "$postcss"` means "use the version of the direct dependency `postcss`".

The rules test runner, in short: `scripts/test-rules.mjs` frees the emulator port, runs
`firebase emulators:exec --only firestore --project demo-<name> "node tests/rules/<your>.test.mjs"` and cleans up. Tests use `@firebase/rules-unit-testing` with `initializeTestEnvironment`, `assertSucceeds` and `assertFails`.

## Appendix G: Firebase client init that cannot break the build

`src/lib/firebase/app.ts`:

```ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore/lite'

const firebaseConfig = {
  // A placeholder keeps `next build` working when the variables are not set (CI, first deploy);
  // sign-in then fails with a Firebase error instead of the build failing.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'missing-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
```

Server side (Admin SDK) reads `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, converting the stored `\n` text back to real newlines (`value.replace(/\\n/g, '\n')`), and should initialise **lazily** so `next build` does not need the secrets.

## Appendix H: `.gitignore` essentials

```gitignore
# dependencies and build output
node_modules/
.next
.next-*/
out
dist

# Next.js generated (rewritten on every dev/build/typegen; path depends on the dist folder)
next-env.d.ts

# environment and secrets
.env
.env.*
*.env
!.env.example
*-firebase-adminsdk-*.json
*service-account*.json
serviceAccount*.json
*.pem
*.p12
*.pfx

# logs, caches, OS and editor noise
*.log
firebase-debug.log
firestore-debug.log
.firebase/
*.tsbuildinfo
.DS_Store
Thumbs.db
.idea/
.vercel

# test output and local sessions
test-results/
playwright-report/
tests/.auth/
*state.json
```

Commit an `.env.example` with variable names and empty values only (Appendix I).

## Appendix I: environment variable reference and `.env.example`

```env
# Copy to .env.local for local development (never commit .env.local). Use the TEST project values.
NODE_ENV=development

# Firebase client SDK (public identifiers; safe in the browser)
# Firebase console, Project settings, General, Your apps, Web app, Config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (SECRET, server only)
# Firebase console, Project settings, Service accounts, Generate new private key.
# Paste the private key as ONE line, keeping the literal \n sequences, wrapped in quotes.
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# App behaviour
NEXT_PUBLIC_ALLOW_REGISTRATION=true

# Optional: end-to-end tests (TEST project only, never production)
# TEST_USER_EMAIL=
# TEST_USER_PASSWORD=
```

| Where it is set | Variables |
|---|---|
| Vercel (per project) | all of the above except `NODE_ENV` and the test-user pair |
| GitHub secrets | `FIREBASE_SERVICE_ACCOUNT_TEST`, `FIREBASE_SERVICE_ACCOUNT_PROD` (whole JSON) |
| Your machine (`.env.local`) | the test project's values |

## Appendix J: browser-console snippets

Wiring check (run on each deployed site; replace the ids):

```js
const urls=[...new Set(performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.includes('/_next/static/')&&u.endsWith('.js')))];
const hits={};
for(const u of urls){ const t=await (await fetch(u)).text();
  for(const p of ['<test-project-id>','<prod-project-id>','missing-api-key']) if(t.includes(p)) hits[p]=(hits[p]||0)+1 }
hits
```

Server smoke test (expect `200` then `401`):

```js
(await fetch('/api/auth/logout',{method:'POST'})).status
(await fetch('/api/auth/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:'x'})})).status
```

## Appendix K: command cheat-sheet

```bash
# Local verification (same as CI)
npm ci --legacy-peer-deps && npm run typecheck && npm run lint && npm run test:rules && npm run build

# Branches
git checkout dev && git pull
git checkout -b feature/<name>
git push -u origin feature/<name>
git checkout dev && git fetch origin && git merge --ff-only origin/main && git push origin dev   # realign dev after a release

# Rules by hand
FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" npx tsx scripts/deploy-firestore-rules.ts --project <project-id> --dry-run
FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" npx tsx scripts/deploy-firestore-rules.ts --project <project-id>

# Security audit of what ships to production
npm audit --omit=dev

# Production-like local run (separate folder so a dev server is not disturbed)
NEXT_DIST_DIR=.next-prod npm run build && NEXT_DIST_DIR=.next-prod npx next start -p 4001
# Strict module-loading test that mimics Vercel's runtime
NEXT_DIST_DIR=.next-prod NODE_OPTIONS=--no-experimental-require-module npx next start -p 4001
```

PowerShell: replace `VAR=x cmd` with `$env:VAR='x'; cmd`, and use `npm.cmd` / `npx.cmd`.

## Appendix L: glossary

| Term | Meaning |
|---|---|
| CI | Continuous integration: automatic checks on every push or PR (here: GitHub Actions job `verify`) |
| CD | Continuous deployment: automatic release after a merge (here: Vercel builds from Git; a workflow publishes rules) |
| Ruleset | GitHub's branch-protection feature that can require PRs and passing checks |
| Environment | A matching Firebase project + Vercel project + Git branch (test or production) |
| Service account | A non-human Google identity; its JSON key lets server code act with its permissions |
| Admin SDK | Firebase's server library; it bypasses Firestore rules, so its keys are secrets |
| Public config | `NEXT_PUBLIC_FIREBASE_*`, identifiers delivered to browsers; protected by rules, not secrecy |
| Authorised domain | A hostname allowed to run Firebase Authentication sign-in |
| Preview deployment | A temporary Vercel build for a non-production branch or PR |
| Scope (Vercel) | Where a variable applies: Production, Preview or Development |
| Redeploy | Rebuild the same commit with the current variables and settings |
| Emulator | Local Firestore used to test rules without touching a real project |
