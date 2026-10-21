# Dispatch: Survey Subagent 2 (Admin CMS & RBAC)

- Role: Specification Miner
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Read ORIGINAL_REQUEST.md thoroughly. Investigate and document all requirements, features, workflows, schema needs, security controls, and acceptance criteria for:
R3: Admin CMS (at `/admin`)
1. Authentication & RBAC:
   - Secure login, session management, server-side session checks.
   - 4 Roles: Super Admin, Content Admin, Booking Staff, Editor.
   - Matrix of permissions per role for all routes and API endpoints. Server-side rejection of unauthorized access.
2. Dashboard:
   - Real-time statistics from DB: total hairstyles, hair colors, services, articles, today's appointments, pending confirmation appointments, recent activity log.
3. Content Management (Full CRUD):
   - Home Banners
   - Categories & Hairstyles
   - Hair Color Swatches
   - Before/After Showcases (with dual images)
   - Services & Combos
   - News / Advisory Articles (SEO fields: title, slug, excerpt, content, meta tags, cover image)
4. Appointment Management:
   - List, search, filter by date and status.
   - Detail view, status update (Pending, Confirmed, Completed, Cancelled, No-show).
   - Internal notes, assign stylist.
5. System Settings (Site Settings):
   - Brand name, logo, favicon, address, hotline, operating hours, social links, Google Maps embed, default SEO, footer info.
6. Audit Logs:
   - Log critical actions (login, create/edit/delete content, appointment status changes) with actor, action, entity, timestamp, details.

Output:
Write a comprehensive specification report to `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2\spec_report.md` and deliver a self-contained `handoff.md`. Notify parent when complete via `send_message`.


## 2026-10-19T02:07:05Z
[Message] sender=daa96dc0-4b53-4192-88a0-f59f39a1f3f3 priority=MESSAGE_PRIORITY_HIGH
You are Survey Spec Miner 2.
Your working directory is: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
Also read your dispatch instructions at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2\DISPATCH.md

Your task is to conduct an exhaustive specification survey of:
R3: Admin CMS (at /admin)
1. Auth & RBAC (Super Admin, Content Admin, Booking Staff, Editor) with server-side session checks and route/API protection.
2. Dashboard metrics (real-time from DB).
3. Full CRUD content management (Banners, Categories/Styles, Hair Colors, Before/After, Services/Combos, SEO Articles).
4. Appointment management (search/filter, status transitions: Pending -> Confirmed -> Completed/Cancelled/No-show, stylist assignment, internal notes).
5. Site Settings (Brand info, contacts, operating hours, SEO defaults, maps, social links).
6. Audit Logs (recording all security and content changes).

Write your detailed findings to:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2\spec_report.md
and write a self-contained handoff report to:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_spec_miner_survey_2\handoff.md

When complete, use send_message to report completion to parent daa96dc0-4b53-4192-88a0-f59f39a1f3f3.
