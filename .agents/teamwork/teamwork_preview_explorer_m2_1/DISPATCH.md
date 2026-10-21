# Dispatch: M2 Explorer 1 (Admin Authentication, Session API & RBAC Route Protection)

- Role: Explorer
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Milestone: M2 - Auth, RBAC & Admin Core
- Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
- Project Specification: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Analyze and formulate concrete implementation blueprints for:
1. Auth Route Handlers:
   - `app/api/auth/login/route.ts`: Validate credentials via Zod `LoginSchema`, check user in Prisma DB, verify bcrypt password, generate secure 32-byte crypto session token in `Session` table, set HTTP-only cookie `salon_session`, record login in `AuditLog`.
   - `app/api/auth/logout/route.ts`: Invalidate session in DB, clear cookie, log audit.
   - `app/api/auth/session/route.ts`: Return current authenticated staff user and assigned role.
2. Admin Login Page:
   - `app/admin/login/page.tsx`: Luxury dark/gold atelier aesthetic, React Hook Form + Zod validation, error handling, redirect upon success to `/admin`.
3. RBAC Middleware & Layout Protection:
   - Middleware / Layout server guard in `app/admin/layout.tsx` enforcing server-side session verification. Unauthorized users redirected to `/admin/login`.
   - Role-based route authorization guards for 4 roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`).

Output:
Write analysis report to:
`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_1\analysis.md`
and handoff report to `handoff.md`. Notify parent via `send_message` when done.

## 2026-10-19T03:04:00Z
Received message from parent orchestrator:
Task: Analyze implementation blueprint for Admin Authentication, Session API (/api/auth/login, /api/auth/logout, /api/auth/session), Login Page (app/admin/login/page.tsx), and RBAC route protection.
Deliver analysis.md and handoff.md in your working directory. Notify parent when complete via send_message.
