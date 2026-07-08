# MediFlow — Pharmacy & Patient Management Portal

Production-ready pharmacy and patient management web application built with Next.js (App Router), TypeScript, Tailwind CSS, Redux Toolkit, and shadcn/ui.

## Features

- **Authentication** — Admin login with email/password, remember me, route protection via middleware
- **Dashboard** — Bento grid layout with animated stats, enrollment trends, recent activity
- **Patients** — Search, filter, paginate, CRUD with guardian and clinical details
- **Staff** — Team management with archive support
- **Medicine Vault** — Medicine categories, patient assignments, schedules
- **Stock & Inventory** — Daily recording and historical summaries
- **Purchase History** — Prescription tracking and printable summaries
- **Billing** — Balance tracking, overdue highlights, payment recording
- **Settings** — Business profile, academic year, user management

## Tech Stack

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS · shadcn/ui · Recharts
- Redux Toolkit · react-hook-form · Zod
- Firebase Firestore · Next.js API routes

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@pharmacy.com | admin123 | Super Admin |
| staff@pharmacy.com | staff123 | Staff |

## Verification

```bash
npm run build
```

## Architecture

```
Pages → services/pharmacy-api.ts / patient-api.ts → app/api/* → Firebase Firestore
```

Patient records are stored under `businesses/{businessId}/patients` in Firestore.
