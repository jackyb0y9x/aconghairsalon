# Dispatch: M2 Worker (Auth, RBAC & Admin Core Implementation)

- Role: Worker / Implementer
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m2_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Milestone: M2 - Auth, RBAC & Admin Core
- Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
- Project Specification: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS (Review these blueprints thoroughly before implementing):
1. M2 Explorer 1: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_1\analysis.md` (Auth routes, Admin Login page, middleware.ts, RBAC guards)
2. M2 Explorer 2: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_2\analysis.md` (Admin layout, AdminSidebar, AdminHeader, Dashboard API, Dashboard page)
3. M2 Explorer 3: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_3\analysis.md` (Settings API & page, Audit Logs API & page, RBAC 403 verbatim responses)

Write Ownership (Exclusive to this Worker):
- `middleware.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/session/route.ts`
- `app/admin/login/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/audit-logs/page.tsx`
- `app/api/admin/dashboard/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/admin/audit-logs/route.ts`
- `components/admin/AdminSidebar.tsx`
- `components/admin/AdminHeader.tsx`
- `components/admin/DashboardKpiCard.tsx`
- `components/admin/AuditDiffModal.tsx`

Implementation Tasks:
1. Implement Auth Routes:
   - `app/api/auth/login/route.ts`: Login with bcrypt verify, session creation in Prisma `Session` table, HTTP-only cookie `salon_session`, audit logging.
   - `app/api/auth/logout/route.ts`: Invalidate session in DB, clear cookie, audit logging.
   - `app/api/auth/session/route.ts`: Return authenticated user and role.
2. Implement Admin Login Page (`app/admin/login/page.tsx`):
   - Luxury atelier styling (Obsidian Noir & Gold), form validation, error banners, redirect to `/admin`.
3. Implement Server-side Admin Shell & Layout (`app/admin/layout.tsx`):
   - Check session, bypass for `/admin/login`, redirect unauthenticated staff to `/admin/login`.
   - Render luxury responsive shell with `AdminSidebar` and `AdminHeader`.
4. Implement Role-Filtered `components/admin/AdminSidebar.tsx`:
   - Enforce 4 roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`). Filter navigation items dynamically based on staff user's role.
   - Highlight active route, mobile responsive drawer, staff badge & logout.
5. Implement `components/admin/AdminHeader.tsx`:
   - Breadcrumb, pending booking alert badge, external site link, profile menu.
6. Implement Dashboard Telemetry:
   - `app/api/admin/dashboard/route.ts`: Parallel Prisma aggregations returning `totalHairstyles`, `totalColors`, `totalServices`, `totalArticles`, `todayBookingsCount`, `pendingBookingsCount`, `recentAuditLogs`.
   - `app/admin/page.tsx`: Metric cards with trend indicators, pending booking alert banner, quick action shortcuts, recent audit activity list.
7. Implement Site Settings:
   - `app/api/admin/settings/route.ts`: Strict `SUPER_ADMIN` guard (403 for other roles), GET returning setting (with lazy upsert), PUT updating setting, cache invalidation (`revalidatePath`), audit log.
   - `app/admin/settings/page.tsx`: 5-tab settings editor with live preview panels.
8. Implement Audit Logs:
   - `app/api/admin/audit-logs/route.ts`: Strict `SUPER_ADMIN` guard (403 for other roles), GET with pagination and filters (`action`, `entity`, `dateRange`, `search`).
   - `app/admin/audit-logs/page.tsx`: Interactive audit log data table, filter badges, 2-column comparative visual JSON diff modal (`AuditDiffModal`), export to CSV/JSON.

Verification Commands:
- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:e2e` (Ensure 67/67 tests continue passing)

Deliver a comprehensive handoff report to `handoff.md` and notify parent via `send_message` when complete.


## 2026-10-19T03:14:06Z
You are the M2 Worker (Auth, RBAC & Admin Core Implementer).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m2_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
Read your dispatch file at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m2_1\DISPATCH.md
Also read the 3 explorer blueprints:
1. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_1\analysis.md
2. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_2\analysis.md
3. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_3\analysis.md

Implement all components for Milestone 2:
- Auth routes (/api/auth/login, /api/auth/logout, /api/auth/session)
- Admin Login Page (app/admin/login/page.tsx)
- Server-side Admin Shell & Layout (app/admin/layout.tsx)
- Role-Filtered Sidebar (components/admin/AdminSidebar.tsx) & AdminHeader (components/admin/AdminHeader.tsx)
- Dashboard Telemetry API (/api/admin/dashboard/route.ts) & Dashboard Page (app/admin/page.tsx)
- Site Settings API (/api/admin/settings/route.ts) & Settings Page (app/admin/settings/page.tsx)
- Audit Logs API (/api/admin/audit-logs/route.ts) & Audit Logs Page (app/admin/audit-logs/page.tsx)
- middleware.ts for edge session & RBAC protection

Run verification commands:
- npx prisma validate
- npx tsc --noEmit
- npm run build
- npm run test:e2e

Deliver handoff.md and report to parent via send_message when complete.
