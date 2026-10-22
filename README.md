# MediFlow — Clinic Stock & Pharmacy Management

Multi-tenant stock, medicine vault and patient management for homeopathy clinics. Built with Next.js 15 (App Router), TypeScript, Tailwind + shadcn/ui, Redux Toolkit, Firebase Auth and Cloud Firestore, deployed on Vercel.

## Features

- **Stock & Inventory** (Firestore, transactional): stock items linked to the medicine vault, batch-level stock with expiry dates, receive / dispense / return / expire / count-correction movements, FEFO (first-expired-first-out) deduction, immutable movement ledger with the acting user, low-stock and expiry alerts, CSV export.
- **Medicine Vault** — medicines, potencies, diseases and shared flag catalogues.
- **Patients** — registration, visits, prescribed medicines, search and CSV export.
- **Billing** — fee balances, payments, CSV export.
- **Dashboard** — live patient growth, stock health, activity feed.
- **Settings** — clinic profile, staff users, roles (`super_admin`, `staff`).
- **Security** — Firestore rules enforcing tenant isolation and roles (tested with the emulator), API routes with role checks, security headers, session cookies verified server-side.

## Quick start

```bash
cp .env.example .env.local          # fill in a Firebase TEST project
npm ci --legacy-peer-deps
npm run dev                         # http://localhost:3000
```

## Quality gates

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript, 0 errors required |
| `npm run lint` | ESLint (errors fail the build) |
| `npm run test:rules` | 100+ Firestore security-rule assertions in the emulator (needs Java) |
| `npm run build` | Production build (no secrets required) |
| `npm run verify` | All of the above |
| `npx playwright test` | End-to-end tests (see `docs/DEPLOYMENT.md`) |

## Deploying

Follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (Firebase rules + Vercel, step by step). The audit history and roadmap are in [`docs/IMPROVEMENT-PLAN.md`](docs/IMPROVEMENT-PLAN.md); project conventions are in [`CLAUDE.md`](CLAUDE.md).
