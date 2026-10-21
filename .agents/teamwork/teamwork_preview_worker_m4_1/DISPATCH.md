# Milestone 4 Worker Dispatch: Public Website Experience

## Identity & Objective
- Role: M4 Implementation Worker (Public Website Experience)
- Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m4_1
- Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

## MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mandatory Inputs to Read:
1. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md` (Features R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7, R1.8)
2. `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md`
3. Explorer 1 Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1\analysis.md`
4. Explorer 2 Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_2\analysis.md`
5. Explorer 3 Blueprint: `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_3\analysis.md`
6. Existing validation schemas & memory store: `lib/validations/booking.ts`, `lib/memory-store.ts`, `prisma/schema.prisma`

## Implementation Scope & Exclusively Owned Files:
1. **Public Layout & Dynamic Home Page**:
   - `app/(public)/layout.tsx`: Luxury layout with sticky header, navigation links, mobile drawer, Site Settings branding, and dynamic footer.
   - `app/(public)/page.tsx` & reconciliation with `app/page.tsx`: 8 dynamic sections (Hero carousel, Service categories, Trending styles, Mini Before/After, Master stylists, Testimonials, Blog preview, CTAs). Make sure there is NO route conflict between `app/page.tsx` and `app/(public)/page.tsx`.
   - `app/api/public/home/route.ts` & `app/api/public/articles/route.ts`: Public read endpoints for home telemetry and articles.
2. **Hairstyle Library & Colors & Before/After Showcase**:
   - `app/(public)/hairstyles/page.tsx` & `components/public/HairstyleCatalogClient.tsx`: 6-criteria multi-filter (`gender`, `length`, `faceShape`, `texture`, `careLevel`, `category`) synchronized with URL query params.
   - `app/(public)/hairstyles/[slug]/page.tsx`: Rich multi-angle gallery, recommendations, try-on & booking direct links.
   - `app/(public)/colors/page.tsx` & `components/public/ColorCatalogClient.tsx`: Filter by Tone, Group, Bleach required; hex swatch cards with sheen gradients, consultative skin tone guide.
   - `app/(public)/before-after/page.tsx` & `components/public/BeforeAfterSlider.tsx`: Interactive drag-handle comparison slider (touch & mouse), service tag filters.
   - `app/api/public/hairstyles/route.ts`, `app/api/public/hairstyles/[slug]/route.ts`, `app/api/public/colors/route.ts`, `app/api/public/before-after/route.ts`: Public read endpoints.
3. **Services Catalog & 5-Step Booking Wizard**:
   - `app/(public)/services/page.tsx` & `components/public/ServicesCatalogClient.tsx`: Categorized service showcase with duration, price tiers, prep & care guides.
   - `app/(public)/booking/page.tsx` & `components/public/BookingWizardClient.tsx`: 5-step wizard (Service -> Style/Color -> Stylist -> DateTime -> Customer Details). Zod client-side validation, salon operating hours check (08:30 - 20:30), anti-duplicate idempotencyKey lock, booking confirmation modal with `BKxxxxxx` code.
   - `app/api/public/services/route.ts`: Public services read endpoint.
4. **Blog & Editorial CMS**:
   - `app/(public)/blog/page.tsx` & `app/(public)/blog/[slug]/page.tsx`: Search, tag filtering, reading time calculation, zero-dependency Markdown renderer, dynamic Open Graph / SEO metadata.

## Verification Requirements:
1. `npx prisma validate`
2. `npx tsc --noEmit` (strict: true, 0 errors)
3. `npm run build` (Next.js production build must compile all public and admin routes cleanly)
4. `npm run test:e2e` (All 67 E2E tests across Tiers 1-4 must continue to pass 100%)
5. Create and run a dedicated verification harness `tests/challenge_m4_harness.ts` covering:
   - Public route accessibility (`/`, `/hairstyles`, `/hairstyles/[slug]`, `/colors`, `/before-after`, `/services`, `/booking`, `/blog`, `/blog/[slug]`).
   - 6D Hairstyle multi-filtering logic and query param reflection.
   - Before/After comparison component logic.
   - 5-step Booking Wizard validation, time slot constraints, and submission flow.
   - Public API endpoints responses and caching headers.

Deliver your completed work in `handoff.md` and notify parent orchestrator via `send_message`.

## 2026-10-19T07:14:00Z
You are the M4 Implementation Worker (Public Website Experience).
Working Directory: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m4_1
Parent Orchestrator ID: daa96dc0-4b53-4192-88a0-f59f39a1f3f3

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS TO READ:
1. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\ORIGINAL_REQUEST.md
2. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\PROJECT.md
3. c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_worker_m4_1\DISPATCH.md
4. Explorer 1 Blueprint: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_1\analysis.md
5. Explorer 2 Blueprint: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_2\analysis.md
6. Explorer 3 Blueprint: c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m4_3\analysis.md

Implement all components for Milestone 4:
- Public Layout & Branding: app/(public)/layout.tsx, Header, Nav, Mobile Drawer, Footer
- Dynamic Home Page: app/(public)/page.tsx (8 dynamic sections), resolve route conflict with app/page.tsx
- Hairstyle Exploration Library: app/(public)/hairstyles/page.tsx (6D URL-synced multi-filter) & [slug]/page.tsx
- Hair Color Swatches & Consultation: app/(public)/colors/page.tsx
- Before/After Interactive Showcase: app/(public)/before-after/page.tsx (interactive drag-handle slider)
- Services & Transparent Pricing: app/(public)/services/page.tsx
- 5-Step Multi-Step Booking Wizard: app/(public)/booking/page.tsx (with client Zod validation, operating hours check, and anti-duplicate idempotencyKey lock)
- Blog & Editorial CMS: app/(public)/blog/page.tsx & [slug]/page.tsx
- Public APIs: app/api/public/*

Verification Requirements:
- npx prisma validate
- npx tsc --noEmit
- npm run build
- npm run test:e2e
- Create and run tests/challenge_m4_harness.ts

Deliver your completed work in handoff.md and notify parent when complete via send_message.

## 2026-10-19T12:53:36Z
**Context**: Milestone 4 Implementation Worker progress check.
**Content**: You made edits to `lib/public-data.ts`, `PublicHeader.tsx`, and `PublicFooter.tsx`. Please continue your execution to implement all remaining components and pages for Milestone 4 (Hairstyles, Colors, Before-After, Services, Booking Wizard, Blog, public APIs, and tests/challenge_m4_harness.ts). Run your verification suite (`npx prisma validate`, `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`, and `tests/challenge_m4_harness.ts`), deliver your `handoff.md`, and report back.
**Action**: Resume execution, complete Milestone 4 deliverables, and send your handoff report.
