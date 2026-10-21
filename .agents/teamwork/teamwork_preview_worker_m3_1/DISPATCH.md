# Milestone 3 Worker Dispatch: Admin Content & Booking Operations

## Identity & Objective
- Role: M3 Implementation Worker (Admin Content & Booking Operations)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m3_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Features R2.2, R2.3, R2.4, R2.5, R2.6)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. Explorer 1 Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_1\analysis.md`
4. Explorer 2 Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_2\analysis.md`
5. Explorer 3 Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m3_3\analysis.md`
6. Prisma Schema: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\prisma\schema.prisma`
7. Existing auth & session helper: `lib/auth.ts`
8. Existing audit service: `services/audit.ts`
9. Existing E2E test assertions: `tests/suites/tier1-features.ts`, `tests/suites/tier2-boundary.ts`, `tests/suites/tier4-realworld.ts`

## Implementation Scope & Exclusively Owned Files:
1. **Validation & State Machine**:
   - `lib/validations/content.ts` (Zod schemas for Banner, Category, Hairstyle, HairColor, BeforeAfter, Service, Article with dual mapping).
   - `lib/booking-state-machine.ts` (5-state FSM: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`; illegal transition prevention; cancellation reason requirement).
2. **API Route Handlers**:
   - `/api/admin/banners` & `[id]` & `[id]/toggle`
   - `/api/admin/categories` & `[id]`
   - `/api/admin/hairstyles` & `[id]` (supports auto-creating default category if not present)
   - `/api/admin/colors` & `[id]` (audit event entity `'HAIR_COLOR'` for TC1.12)
   - `/api/admin/before-after` & `[id]`
   - `/api/admin/services` & `[id]`
   - `/api/admin/articles` & `[id]` (accessible to SUPER_ADMIN, CONTENT_ADMIN, EDITOR)
   - `/api/admin/bookings` & `[id]` & `[id]/status`
   - `/api/bookings` (Public booking submission with idempotency key lock and `BKxxxxxx` code generation)
3. **Admin UI Pages**:
   - `app/admin/banners/page.tsx`
   - `app/admin/categories/page.tsx`
   - `app/admin/hairstyles/page.tsx` & `app/admin/hairstyles/new/page.tsx`
   - `app/admin/colors/page.tsx`
   - `app/admin/before-after/page.tsx`
   - `app/admin/services/page.tsx`
   - `app/admin/articles/page.tsx` & `app/admin/articles/new/page.tsx`
   - `app/admin/bookings/page.tsx`
4. **Admin UI Components (`components/admin/`)**:
   - `BookingDetailModal.tsx` & `CancelBookingModal.tsx`
   - `BannerModal.tsx`
   - `CategoryModal.tsx`
   - `HairstyleForm.tsx`
   - `ColorSwatchModal.tsx`
   - `BeforeAfterModal.tsx`
   - `ServiceModal.tsx`
   - `ArticleEditor.tsx`

## Verification Commands to Run & Pass:
1. `npx prisma validate`
2. `npx tsc --noEmit` (strict: true, 0 errors)
3. `npm run build` (Next.js production build must compile all routes cleanly)
4. `npm run test:e2e` (All 67 E2E tests across Tiers 1-4 must continue to pass 100%)
5. Create a dedicated challenge test script `tests/challenge_m3_harness.ts` covering:
   - Full CRUD lifecycle on all 7 entities
   - 5-state booking transitions (valid and illegal rejected)
   - Mandatory cancellation reason validation
   - RBAC enforcement (EDITOR blocked from banners/styles; BOOKING_STAFF blocked from content; CONTENT_ADMIN blocked from bookings)
   - Dual-mapping field preservation
   - Audit log emission for each action

Deliver your completed work with passing command outputs in `handoff.md` and notify the parent orchestrator via `send_message`.
