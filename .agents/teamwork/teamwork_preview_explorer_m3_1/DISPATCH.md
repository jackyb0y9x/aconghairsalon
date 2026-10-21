# Milestone 3 Explorer 1 Dispatch: Content Catalog (Banners, Categories, Hairstyles, Colors)

## Identity & Objective
- Role: M3 Explorer - Content Catalog (Banners, Categories, Hairstyles, Colors)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\prisma\schema.prisma` (Models: Banner, Category, Hairstyle, HairstyleImage, HairstylePriceTier, HairColor)
4. Existing Admin Layout & Shell: `app/admin/layout.tsx`, `components/admin/AdminSidebar.tsx`

## Scope & Analysis Tasks:
1. **Banners CRUD (`/admin/banners`)**:
   - API endpoints: `GET /api/admin/banners`, `POST /api/admin/banners`, `PUT /api/admin/banners/[id]`, `DELETE /api/admin/banners/[id]`, `PATCH /api/admin/banners/[id]/toggle`.
   - UI: Table listing with thumbnail, title, subtitle, order, active switch, and date range. Modal/Form for Create/Edit.
2. **Categories & Hairstyles CRUD (`/admin/hairstyles`, `/admin/categories`)**:
   - Categories API & UI: listing, create, edit, delete.
   - Hairstyles API: `GET /api/admin/hairstyles`, `POST /api/admin/hairstyles`, `PUT /api/admin/hairstyles/[id]`, `DELETE /api/admin/hairstyles/[id]`.
   - Hair properties: gender (`MALE`, `FEMALE`, `UNISEX`), length (`SHORT`, `MEDIUM`, `LONG`), faceShape, texture, careLevel, priceTiers, images.
   - UI: Hairstyle filter/search table, badge tags, featured/trending toggles, image gallery manager, price tier manager.
3. **Hair Color Swatches CRUD (`/admin/colors`)**:
   - API endpoints: `GET /api/admin/colors`, `POST /api/admin/colors`, `PUT /api/admin/colors/[id]`, `DELETE /api/admin/colors/[id]`.
   - Properties: name, hexCode, tone (`WARM`, `COOL`, `NEUTRAL`), colorGroup, bleachRequired, skinToneMatch.
   - UI: Color swatch grid/table with real hex preview badge, bleach indicator, edit/create form.
4. Validation schemas in `lib/validations/content.ts` (Zod).
5. Audit logging integration (`services/audit.ts`) for all mutations.
6. RBAC guards: `SUPER_ADMIN` and `CONTENT_ADMIN` only.

Deliver your detailed blueprint in `analysis.md` and executive handoff in `handoff.md`.
Notify parent orchestrator when complete via `send_message`.

## 2026-10-19T04:46:55Z
You are M3 Explorer 1 (Content Catalog Specialist).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, your DISPATCH.md, and prisma/schema.prisma.
Task: Design the implementation blueprint for Banners (/admin/banners), Categories & Hairstyles (/admin/hairstyles, /admin/categories), and Hair Color Swatches (/admin/colors) with API routes, validation schemas in lib/validations/content.ts, RBAC guards, and UI components.
Deliver analysis.md and handoff.md in your working directory. Notify parent when complete via send_message.
