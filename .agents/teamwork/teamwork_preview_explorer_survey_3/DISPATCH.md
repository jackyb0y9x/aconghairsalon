# Dispatch: Survey Subagent 3 (Technical Architecture, DB Schema, Seed Data & Acceptance Criteria)

- Role: Technical Architecture Explorer
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_survey_3
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3
- Original Request File: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Read ORIGINAL_REQUEST.md thoroughly. Investigate and specify the complete technical architecture and infrastructure needed to satisfy R4 and all Acceptance Criteria:
1. Framework & Language:
   - Next.js latest stable App Router with TypeScript `strict: true`.
   - Clear folder hierarchy: `app/(public)`, `app/admin`, `app/api`, `components/public`, `components/admin`, `components/ui`, `lib`, `services`, `types`, `prisma`.
2. UI & Styling:
   - Tailwind CSS with luxury aesthetic (modern hair salon brand styling, gold/black/dark/champagne or modern clean palette), responsive mobile-first.
   - shadcn/ui components integration.
3. Forms & Validation:
   - React Hook Form + Zod schema for client and server-side validation.
4. Database & ORM:
   - PostgreSQL schema via Prisma ORM.
   - Complete Prisma models and relations covering all requirements: User, Role, Account/Session, Category, Hairstyle, HairColor, Service, ServiceCombo, BeforeAfter, Booking, Banner, Article, SiteSetting, AuditLog.
   - Rich seed data script (`prisma/seed.ts`) populating all entities for immediate testing after installation.
   - Migration and client generation commands.
5. Storage & Cloud Provider Abstraction:
   - File/image storage abstraction layer (Cloudinary / Supabase Storage / mock fallback), zero local disk storage in serverless container.
6. Serverless Optimization:
   - Stateless architecture, no in-memory state or infinite background loops, fully Vercel-ready.
7. Verification & Acceptance Criteria:
   - `npx tsc --noEmit` clean compilation.
   - `npm run build` production build succeeds.
   - `npx prisma validate && npx prisma generate` succeeds.
   - `.env.example` and comprehensive `README.md` with installation, migration, seed, and Vercel deployment guide.

Output:
Write a comprehensive technical architecture report to `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_survey_3\architecture_report.md` and deliver a self-contained `handoff.md`. Notify parent when complete via `send_message`.


## 2026-10-19T02:07:05Z
[Message] sender=daa96dc0-4b53-4192-88a0-f59f39a1f3f3 priority=MESSAGE_PRIORITY_HIGH
You are Survey Explorer 3.
Your working directory is: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_survey_3
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
Also read your dispatch instructions at:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_survey_3\DISPATCH.md

Your task is to investigate and specify the technical architecture and data layer satisfying R4 and Acceptance Criteria:
1. Next.js 14/15 App Router architecture with TypeScript strict: true.
2. Exact folder organization: app/(public), app/admin, app/api, components/public, components/admin, components/ui, lib, services, types, prisma.
3. Tailwind CSS & shadcn/ui design tokens, luxury salon aesthetic.
4. Prisma schema with complete models: User, Role, Account/Session, Category, Hairstyle, HairColor, Service, ServiceCombo, BeforeAfter, Booking, Banner, Article, SiteSetting, AuditLog.
5. Rich seed script (prisma/seed.ts) to populate realistic Vietnamese & international modern salon data for instant testing.
6. Cloud storage abstraction (Cloudinary/Supabase/mock) with no local container filesystem dependencies.
7. Vercel serverless compliance.
8. Acceptance Criteria checklist & verification commands (tsc, npm run build, prisma validate/generate).

Write your detailed architecture report to:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_survey_3\architecture_report.md
and write a self-contained handoff report to:
c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_survey_3\handoff.md

When complete, use send_message to report completion to parent daa96dc0-4b53-4192-88a0-f59f39a1f3f3.
