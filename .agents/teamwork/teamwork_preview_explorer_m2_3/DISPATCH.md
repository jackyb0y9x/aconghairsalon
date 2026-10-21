# Dispatch: M2 Explorer 3 (Site Settings & Audit Logs Management)

- Role: Explorer
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_3
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Milestone: M2 - Auth, RBAC & Admin Core
- Project Root: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode
- Project Specification: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Analyze and formulate concrete implementation blueprints for:
1. Site Settings Subsystem:
   - `app/api/admin/settings/route.ts`: GET endpoint returning current singleton `SiteSetting`; PUT/POST endpoint validating input with Zod, updating setting, invalidating cache (`revalidatePath('/')`), and recording `SETTINGS_UPDATE` in `AuditLog`. Strictly guarded for `SUPER_ADMIN`.
   - `app/admin/settings/page.tsx`: Comprehensive form to edit Brand Name, Logo URL, Favicon, Hotline, Address, Operating Hours, Social Media Links (Facebook, Instagram, TikTok, Zalo), Google Maps Embed code, Default SEO Meta Title/Description, and Footer Text.
2. Audit Logs Subsystem:
   - `app/api/admin/audit-logs/route.ts`: GET endpoint with pagination, action filter, date range filter, searching by actor name or entity. Strictly guarded for `SUPER_ADMIN`.
   - `app/admin/audit-logs/page.tsx`: Interactive audit log data table with search, filter badges, timestamp formatting, JSON diff modal/viewer, and export capability.

Output:
Write analysis report to:
`c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_3\analysis.md`
and handoff report to `handoff.md`. Notify parent via `send_message` when done.

## 2026-10-19T03:04:00Z
Received message from parent orchestrator:
Task: Analyze implementation blueprint for Site Settings API & Page (/api/admin/settings, app/admin/settings/page.tsx) and Audit Logs API & Page (/api/admin/audit-logs, app/admin/audit-logs/page.tsx).
Deliver analysis.md and handoff.md in your working directory. Notify parent when complete via send_message.
