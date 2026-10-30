# Security Self-Audit Report

Conducted on: 2026-10-30  
Project: Real Estate Management Platform (`real-estate-app`)  
Framework: Next.js 16 (App Router), Prisma 7, Auth.js v5  

---

## 1. Server Actions & Route Handlers Audit

| Target | Type | Guard Mechanism | Finding | File & Line |
|---|---|---|---|---|
| `createInvitation` | Server Action | `requireRole(["OWNER", "ADMIN"])` | **PASS** | [`src/app/(dashboard)/actions/invitations.ts:21`](file:///c:/dev/real-estate-app/src/app/(dashboard)/actions/invitations.ts#L21) |
| `revokeInvitation` | Server Action | `requireRole(["OWNER", "ADMIN"])` | **PASS** | [`src/app/(dashboard)/actions/invitations.ts:129`](file:///c:/dev/real-estate-app/src/app/(dashboard)/actions/invitations.ts#L129) |
| `loginAction` | Server Action | None (Public login entry point) | **PASS** | [`src/app/(public)/login/actions.ts:16`](file:///c:/dev/real-estate-app/src/app/(public)/login/actions.ts#L16) |
| `isRegistrationOpen` | Server Action | None (Public system state check) | **PASS** | [`src/app/(public)/register/actions.ts:17`](file:///c:/dev/real-estate-app/src/app/(public)/register/actions.ts#L17) |
| `registerAction` | Server Action | None (Guarded by atomic `tx.user.count() === 0` check) | **PASS** | [`src/app/(public)/register/actions.ts:26`](file:///c:/dev/real-estate-app/src/app/(public)/register/actions.ts#L26) |
| `acceptInviteAction` | Server Action | None (Guarded by SHA-256 invitation token verification) | **PASS** | [`src/app/(public)/accept-invite/actions.ts:22`](file:///c:/dev/real-estate-app/src/app/(public)/accept-invite/actions.ts#L22) |
| `GET, POST /api/auth/[...nextauth]` | Route Handler | Auth.js handlers (Public OAuth/session/CSRF route) | **PASS** | [`src/app/api/auth/[...nextauth]/route.ts:3`](file:///c:/dev/real-estate-app/src/app/api/auth/[...nextauth]/route.ts#L3) |
| Role Dashboard Routing | Edge Proxy | `src/proxy.ts` role & auth matching | **PASS** | [`src/proxy.ts:14-58`](file:///c:/dev/real-estate-app/src/proxy.ts#L14-L58) |
| Dashboard Layout Guards | Server Components | `requireRole([ROLE])` on each dashboard layout | **PASS** | [`src/app/(dashboard)/owner/layout.tsx:32`](file:///c:/dev/real-estate-app/src/app/(dashboard)/owner/layout.tsx#L32), [`admin/layout.tsx:26`](file:///c:/dev/real-estate-app/src/app/(dashboard)/admin/layout.tsx#L26), [`tenant/layout.tsx:26`](file:///c:/dev/real-estate-app/src/app/(dashboard)/tenant/layout.tsx#L26), [`caretaker/layout.tsx:22`](file:///c:/dev/real-estate-app/src/app/(dashboard)/caretaker/layout.tsx#L22) |

---

## 2. Password Hash Protection Audit

Goal: Ensure `passwordHash` never leaks to the client via Prisma queries, return objects, session tokens, or React Server Component props.

- **Auth Provider `authorize`**:
  `src/auth.ts` verifies the password via `bcrypt.compare` and explicitly constructs a return object containing only `{ id, name, email, role, timezone }`.
  **PASS** — [`src/auth.ts:66-72`](file:///c:/dev/real-estate-app/src/auth.ts#L66-L72)
- **NextAuth Callbacks**:
  `src/auth.config.ts` transfers only `id`, `role`, and `timezone` to the JWT and session. `passwordHash` is absent.
  **PASS** — [`src/auth.config.ts:17-36`](file:///c:/dev/real-estate-app/src/auth.config.ts#L17-L36)
- **Login Server Action**:
  `src/app/(public)/login/actions.ts` queries the user with `select: { role: true, isActive: true }`. `passwordHash` is never selected or returned.
  **PASS** — [`src/app/(public)/login/actions.ts:29-32`](file:///c:/dev/real-estate-app/src/app/(public)/login/actions.ts#L29-L32)
- **Registration Server Action**:
  `src/app/(public)/register/actions.ts` creates the user with hashed password and returns `{ success: true }` without returning user entities.
  **PASS** — [`src/app/(public)/register/actions.ts:45-73`](file:///c:/dev/real-estate-app/src/app/(public)/register/actions.ts#L45-L73)
- **Accept Invite Server Action**:
  `src/app/(public)/accept-invite/actions.ts` creates the user with hashed password and returns `{ success: true }`.
  **PASS** — [`src/app/(public)/accept-invite/actions.ts:64-109`](file:///c:/dev/real-estate-app/src/app/(public)/accept-invite/actions.ts#L64-L109)
- **Invitation Management & Lookups**:
  Queries in `src/app/(dashboard)/actions/invitations.ts` select only `{ id: true }` when verifying user existence.
  **PASS** — [`src/app/(dashboard)/actions/invitations.ts:43-46`](file:///c:/dev/real-estate-app/src/app/(dashboard)/actions/invitations.ts#L43-L46)
- **Server-to-Client Component Props**:
  All dashboard layouts map session user to a plain sanitized object `{ id, name, email, role, timezone }` before passing to `DashboardShell`. Invitations view receives serialized dates and strings.
  **PASS** — [`src/app/(dashboard)/owner/layout.tsx:35-41`](file:///c:/dev/real-estate-app/src/app/(dashboard)/owner/layout.tsx#L35-L41)

---

## 3. Invitation Token Security Audit

- **Token Storage**:
  When creating an invitation, a 32-byte cryptographically secure random token is generated (`crypto.randomBytes(32)`). Only its SHA-256 hexadecimal hash is stored in the `Invitation.token` column.
  **PASS** — [`src/app/(dashboard)/actions/invitations.ts:73-84`](file:///c:/dev/real-estate-app/src/app/(dashboard)/actions/invitations.ts#L73-L84)
- **Activity & System Logging**:
  Activity log metadata logs `{ email, role, propertyId, unitId }`. Raw tokens are never logged to `ActivityLog` or console output.
  **PASS** — [`src/app/(dashboard)/actions/invitations.ts:93-104`](file:///c:/dev/real-estate-app/src/app/(dashboard)/actions/invitations.ts#L93-L104)
- **Token Verification & Lookup**:
  Both the `/accept-invite` page and `acceptInviteAction` hash the client-supplied token with SHA-256 before querying Prisma by `where: { token: hashedToken }`.
  **PASS** — [`src/app/(public)/accept-invite/page.tsx:47`](file:///c:/dev/real-estate-app/src/app/(public)/accept-invite/page.tsx#L47), [`src/app/(public)/accept-invite/actions.ts:33`](file:///c:/dev/real-estate-app/src/app/(public)/accept-invite/actions.ts#L33)

---

## 4. Input Validation & Rate Limiting Audit

- **Registration Schema Validation**:
  `registerAction` parses input with `registerSchema.safeParse` (validates name, email, password min length 8).
  **PASS** — [`src/app/(public)/register/actions.ts:27`](file:///c:/dev/real-estate-app/src/app/(public)/register/actions.ts#L27)
- **Accept Invite Schema Validation**:
  `acceptInviteAction` parses input with `acceptInviteSchema.safeParse` (validates token, name, password min length 8).
  **PASS** — [`src/app/(public)/accept-invite/actions.ts:23`](file:///c:/dev/real-estate-app/src/app/(public)/accept-invite/actions.ts#L23)
- **Invitation Creation Validation**:
  `createInvitation` parses input with `createInvitationSchema.safeParse` (validates email, role).
  **PASS** — [`src/app/(dashboard)/actions/invitations.ts:23`](file:///c:/dev/real-estate-app/src/app/(dashboard)/actions/invitations.ts#L23)
- **Login Rate Limiter Application**:
  `checkLoginRateLimit` (5 attempts / 15 minutes) is invoked in `src/auth.ts:37` inside Auth.js `authorize()`.
  **PASS** — [`src/auth.ts:37-41`](file:///c:/dev/real-estate-app/src/auth.ts#L37-L41)
- **Pre-auth Rate Limit Bypass on Non-existent Accounts**:
  In `loginAction`, `prisma.user.findUnique` is executed before calling `signIn()`. If the user does not exist or is inactive, the function returns `{ success: false, error: "Invalid email or password." }` immediately without invoking `signIn()`. As a result, requests targeting non-existent accounts do not trigger `checkLoginRateLimit()`.
  **WARN** — [`src/app/(public)/login/actions.ts:29-39`](file:///c:/dev/real-estate-app/src/app/(public)/login/actions.ts#L29-L39)
- **Client IP in Rate Limiter**:
  In `src/auth.ts`, `checkLoginRateLimit(normalizedEmail)` is called without passing client IP (defaults to `"unknown"`), tracking rate limits by email only rather than IP + email.
  **WARN** — [`src/auth.ts:37`](file:///c:/dev/real-estate-app/src/auth.ts#L37)

---

## 5. Git & Secret Hygiene Audit

- **Environment & Secrets Gitignored**:
  `.gitignore` explicitly ignores `.env`, `.env.local`, and `.env*.local`.
  **PASS** — [`.gitignore:34-36`](file:///c:/dev/real-estate-app/.gitignore#L34-L36)
- **Generated Prisma Artifacts Gitignored**:
  `.gitignore` ignores `src/generated` and `/src/generated/prisma`.
  **PASS** — [`.gitignore:46-47`](file:///c:/dev/real-estate-app/.gitignore#L46-L47)

---

## Audit Summary

- **PASS**: 15
- **WARN**: 2
  - `WARN 1`: [`src/app/(public)/login/actions.ts:29-39`](file:///c:/dev/real-estate-app/src/app/(public)/login/actions.ts#L29-L39) — Pre-check returns before `signIn()`, bypassing login rate limiting for non-existent email addresses.
  - `WARN 2`: [`src/auth.ts:37`](file:///c:/dev/real-estate-app/src/auth.ts#L37) — `checkLoginRateLimit` called without client IP, aggregating rate limits across all clients per email.
- **FAIL**: 0

