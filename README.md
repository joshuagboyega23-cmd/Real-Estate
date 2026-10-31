# Real Estate Management Platform

A modern, multi-role real estate management platform designed for property owners, administrators, caretakers, and tenants to manage properties, units, leases, maintenance requests, and financial transactions.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19)
- **Language**: TypeScript (strict mode, zero `any`)
- **Styling & UI**: Tailwind CSS v4, shadcn/ui (Radix primitives, Vega style), Lucide Icons
- **Database & ORM**: PostgreSQL (Supabase) with [Prisma ORM 7](https://www.prisma.io) (`@prisma/adapter-pg` driver adapter)
- **File Storage**: Supabase Storage (`property-images` public bucket, direct signed upload)
- **Authentication**: [Auth.js v5](https://authjs.dev) (`next-auth@beta`, edge-compatible JWT session strategy)
- **Validation**: Zod (all server actions and client forms strictly validated)

---

## Environment Variables

Create a `.env` file in the project root with the following variables (all storage and contact keys are optional at build time):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (transaction pooler connection for application runtime). |
| `DIRECT_URL` | Direct PostgreSQL connection string without pooler (used by Prisma CLI for migrations). |
| `AUTH_SECRET` | Secret key used to encrypt session tokens and Auth.js cookies (generate via `npx auth secret`). |
| `AUTH_URL` | Canonical application URL (e.g., `http://localhost:3000`). |
| `SEED_PASSWORD` | *(Optional)* Default password assigned to seeded accounts in development. |
| `NEXT_PUBLIC_SUPABASE_URL` | *(Optional)* Supabase project URL for public file asset URLs and client storage. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *(Optional)* Supabase publishable/anon API key. |
| `SUPABASE_SECRET_KEY` | *(Optional, Server Only)* Supabase service role secret key used to generate signed upload URLs. Never exposed to the browser. |
| `NEXT_PUBLIC_CONTACT_PHONE` | *(Optional)* Public contact telephone shown on property listing cards. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | *(Optional)* Public contact email shown on property listing cards. |

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
Populates the database with demo accounts (`owner@example.com`, `caretaker@example.com`, `tenant@example.com`), sample property, units, and active lease records.
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

## Multi-Role Architecture & Route Map

A single user account (`User`) can hold multiple roles (`roles Role[]`) and switch between them dynamically without re-authenticating:
- Active session carries `activeRole: Role` and `roles: Role[]`.
- Role switching is accessible via the user profile dropdown in the top header when more than one role is held.
- `requireRole` verifies the user's role against the database on each request (cached with React `cache()`).

| Role | Accessible Area | Capabilities |
|---|---|---|
| **OWNER** | `/owner` | Full property, unit, and lease administration. Can invite Admins, Caretakers, and Tenants. |
| **ADMIN** | `/admin` | Operational oversight, all properties, user management, and activity monitoring. |
| **CARETAKER** | `/caretaker` | Inspection of assigned properties and photo upload/management for maintenance. |
| **TENANT** | `/tenant` | View active lease terms, submit maintenance requests, and track rent payments. |

### Public Routes
- `/`: Marketing landing page with hero search, featured properties, and workflow guides
- `/properties`: Public listings page with keyword search, bedroom/rent filters, and pagination
- `/properties/[slug]`: Public property page with interactive photo gallery, specs, and units availability
- `/login`: Role-aware credentials sign-in
- `/register`: Initial owner bootstrapping
- `/accept-invite`: Token-based account onboarding (supports 1-click confirmation for existing users)
- `/api/auth/*`: Auth.js session and authentication endpoints

---

## Registration & Multi-Role Invitation Rules

1. **Owner Bootstrap**:
   - Self-registration at `/register` is permitted **only** when there are 0 users in the database.
   - The first registered user is automatically assigned the `OWNER` role (`roles: [OWNER]`).
   - Once any user exists, open registration closes permanently.
2. **Multi-Role Invitation Onboarding**:
   - Owners and Admins invite users via `/owner/invitations` or `/admin/invitations`.
   - Existing email addresses can be invited to new roles (e.g. an Owner who is also a Tenant elsewhere), provided they do not already hold that role.
   - Nobody can invite the `OWNER` role.
   - Invitations generate a cryptographically secure 32-byte token stored solely as a SHA-256 hash.
   - Invitations expire after 7 days.
   - When accepting an invite:
     - If the visitor is already signed into that email: 1-click confirmation adds the role and switches context.
     - If the visitor has an existing account but is logged out: verifies their existing password (rate-limited).
     - If it is a new email: presents the full account creation form.

---

## Photo Uploads via Supabase Storage

- Image bytes never pass through the Next.js server.
- The browser resizes and compresses each image to at most 1600px on the long side as WebP under ~800KB.
- Server action `getPhotoUploadUrl` issues a signed upload URL from Supabase Storage (`property-images` bucket).
- Browser uploads directly via `uploadToSignedUrl`.
- Server action `confirmPhotoUpload` validates the file path prefix and registers the URL on the Property or Unit.
- Limit: up to 10 photos per property and 5 per unit. First photo acts as the primary cover photo.

---

## Windows Development Tips

- **Directory Location**: Keep this repository on a local drive outside of OneDrive or cloud-synced folders to prevent file locking and latency issues.
- **Path Characters**: Ensure the project directory path contains no spaces (e.g. `C:\dev\real-estate-app`).
- **Node.js DNS Resolution**: Node.js on Windows defaults to IPv6, which can cause connection timeouts with Supabase pooler endpoints. IPv4-first resolution is enabled in `src/lib/prisma.ts` and `prisma/seed.ts`.
- **Command Shell**: Run CLI commands using PowerShell or Command Prompt. When running npm/npx scripts in PowerShell, ensure execution policies permit script execution or use `cmd /c npm ...`.
