# Real Estate Management Platform

A modern, multi-tenant real estate management platform designed for property owners, administrators, caretakers, and tenants to manage properties, units, leases, maintenance requests, and financial transactions.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19)
- **Language**: TypeScript (strict mode, zero `any`)
- **Styling & UI**: Tailwind CSS v4, shadcn/ui (Radix primitives, Vega style), Lucide Icons
- **Database & ORM**: PostgreSQL (Supabase) with [Prisma ORM 7](https://www.prisma.io) (`@prisma/adapter-pg` driver adapter)
- **Authentication**: [Auth.js v5](https://authjs.dev) (`next-auth@beta`, edge-compatible JWT session strategy)
- **Validation**: Zod (all server actions and client forms validated)

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (transaction pooler connection for application runtime). |
| `DIRECT_URL` | Direct PostgreSQL connection string without pooler (used by Prisma CLI for migrations). |
| `AUTH_SECRET` | Secret key used to encrypt session tokens and Auth.js cookies (generate via `npx auth secret`). |
| `AUTH_URL` | Canonical application URL (e.g., `http://localhost:3000`). |
| `SEED_PASSWORD` | *(Optional)* Default password assigned to seeded accounts in development. |

> **Security Note**: Never commit `.env` or print secret values. Both `.env` and `.env.local` are excluded via `.gitignore`.

---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migrations & Client Generation
This project uses **Prisma 7** configured via [`prisma7.config.ts`](./prisma7.config.ts). The client is generated to [`src/generated/prisma`](./src/generated/prisma).
```bash
# Run database migrations
npm run db:migrate

# Generate the Prisma 7 client
npm run db:generate
```

### 3. Seed Development Data
Populates the database with demo users (`owner@example.com`, `caretaker@example.com`, `tenant@example.com`), sample properties, units, and active lease records.
```bash
npm run db:seed
```
*(Seeding refuses to run in production environments and is fully idempotent).*

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Inspect Database (Optional)
```bash
npm run db:studio
```

---

## Role & Route Map

| Role | Accessible Area | Capabilities |
|---|---|---|
| **OWNER** | `/owner` | Full property, unit, and lease administration. Can invite Admins, Caretakers, and Tenants. |
| **ADMIN** | `/admin` | Operational oversight, user management, and activity monitoring. Can invite Caretakers and Tenants. |
| **CARETAKER** | `/caretaker` | Inspection of assigned properties and handling unit maintenance workflows. |
| **TENANT** | `/tenant` | View active lease terms, submit maintenance requests, and track rent payments. |

### Public Routes
- `/`: Landing page
- `/login`: Role-aware credentials sign-in
- `/register`: Initial owner bootstrapping
- `/accept-invite`: Token-based account onboarding
- `/api/auth/*`: Auth.js session and authentication endpoints

---

## Registration & Invitation Rules

1. **Owner Bootstrap**:
   - Self-registration at `/register` is permitted **only** when there are 0 users in the database.
   - The first registered user is automatically assigned the `OWNER` role.
   - Once the first user exists, open registration closes permanently.
2. **Invitation-Only Onboarding**:
   - All subsequent users (`ADMIN`, `CARETAKER`, `TENANT`) must be invited by an Owner or Admin.
   - Invitations generate a cryptographically random 32-byte token. Only the SHA-256 hash is saved to the database.
   - Invitations expire after 7 days.
   - Redemptions via `/accept-invite?token=...` verify the token hash, create the user with the preassigned role, and automatically link caretakers to assigned properties.

---

## Windows Development Tips

- **Directory Location**: Keep this repository on a local drive outside of OneDrive or cloud-synced folders to prevent file locking and latency issues.
- **Path Characters**: Ensure the project directory path contains no spaces (e.g. `C:\dev\real-estate-app`).
- **Node.js DNS Resolution**: Node.js on Windows defaults to IPv6, which can cause connection timeouts with Supabase pooler endpoints. IPv4-first resolution is enabled in `src/lib/prisma.ts` and `prisma/seed.ts`.
- **Command Shell**: Run CLI commands using PowerShell or Command Prompt. When running npm/npx scripts in PowerShell, ensure execution policies permit script execution or use `cmd /c npm ...`.
